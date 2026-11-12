import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { z } from 'npm:zod@3';
import { streamResponse, GatewayError, type ResponsesInputItem } from 'npm:@lovable.dev/ai-gateway@0.1.11';
import { advisorInstructions, tehranStudyDate } from './policy.ts';

const inputSchema = z.object({ text: z.string().trim().min(1).max(4000), request_id: z.string().uuid() }).strict();
const safeError = (error: unknown) => {
  if (error instanceof GatewayError) {
    if (error.httpStatus === 402) return 'اعتبار هوش مصنوعی تمام شده است؛ مالک سایت باید اعتبار را افزایش دهد.';
    if (error.httpStatus === 429) return 'مشاور فعلاً شلوغ است؛ کمی بعد دوباره پیام بده.';
    if (error.httpStatus === 403) return 'دسترسی مشاور محدود شده است؛ تنظیمات دسترسی باید بررسی شود.';
  }
  return 'پاسخ کامل نشد؛ پیام تو محفوظ است. درخواست خودکار تکرار نمی‌شود.';
};

Deno.serve(async req => {
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  const json = (body: object, status = 200) => new Response(JSON.stringify(body), { headers, status });
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  if (req.method !== 'POST') return json({ error: 'روش درخواست معتبر نیست.' }, 405);
  const authorization = req.headers.get('Authorization');
  if (!authorization) return json({ error: 'ابتدا وارد حسابت شو.' }, 401);
  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authorization } } });
  const { data: auth, error: authError } = await client.auth.getUser();
  if (authError || !auth.user) return json({ error: 'نشست معتبر نیست؛ دوباره وارد شو.' }, 401);
  let raw: unknown;
  try { raw = await req.json(); } catch { return json({ error: 'پیام معتبر نیست.' }, 400); }
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) return json({ error: 'پیام باید بین ۱ تا ۴۰۰۰ نویسه باشد.' }, 400);
  const uid = auth.user.id;
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const { text, request_id } = parsed.data;
  const { data: existing, error: existingError } = await client.from('advisor_messages').select('id,role,content').eq('user_id', uid).eq('request_id', request_id);
  if (existingError) return json({ error: 'سابقه گفتگو در دسترس نیست.' }, 503);
  if (existing?.length) {
    const answer = existing.find(m => m.role === 'assistant');
    return answer ? json({ answer }) : json({ error: 'این پیام قبلاً ارسال شده؛ برای جلوگیری از پاسخ تکراری دوباره اجرا نمی‌شود.' }, 409);
  }
  const today = tehranStudyDate();
  const since = new Date(today + 'T12:00:00Z'); since.setUTCDate(since.getUTCDate() - 14);
  const sinceDate = `${since.getUTCFullYear()}-${String(since.getUTCMonth()+1).padStart(2,'0')}-${String(since.getUTCDate()).padStart(2,'0')}`;
  const [history, bites, logs, legacy, profile] = await Promise.all([
    client.from('advisor_messages').select('role,content').eq('user_id', uid).order('created_at', { ascending: true }),
    client.from('bites').select('id,subject,title,planned_date,target_minutes,target_tests,needs_review,manually_completed').eq('user_id', uid).gte('planned_date', sinceDate).limit(300),
    client.from('bite_logs').select('bite_id,date,minutes,tests_done,correct,wrong,blank,energy').eq('user_id', uid).is('deleted_at', null).gte('date', sinceDate).limit(1000),
    client.from('daily_logs').select('date,total_study_hours,total_tests,overall_score').eq('user_id', uid).gte('date', sinceDate),
    client.from('profiles').select('display_name').eq('id', uid).maybeSingle(),
  ]);
  if ([history, bites, logs, legacy, profile].some(result => result.error)) return json({ error: 'دریافت اطلاعات مطالعه کامل نشد؛ بدون اطلاعات واقعی پاسخ نمی‌سازم.' }, 503);
  const saved = await admin.from('advisor_messages').insert({ user_id: uid, role: 'user', content: text, request_id }).select('id').single();
  if (saved.error) return json({ error: 'ذخیره پیام انجام نشد؛ دوباره ارسال خودکار نمی‌کنم.' }, 409);
  const input: ResponsesInputItem[] = (history.data ?? []).map(m => m.role === 'assistant'
    ? { role: 'assistant', content: [{ type: 'output_text', text: m.content }] }
    : { role: 'user', content: m.content });
  input.push({ role: 'user', content: text });
  const abort = new AbortController();
  req.signal.addEventListener('abort', () => abort.abort(), { once: true });
  const context = JSON.stringify({ today, name: profile.data?.display_name, planned_items: bites.data, recent_events: logs.data, legacy_summaries_not_additive: legacy.data });
  let stream;
  try {
    stream = await streamResponse({ model: 'openai/gpt-6-astra', instructions: `${advisorInstructions}\nداده واقعی حساب:\n${context}`, input, max_output_tokens: 2400 }, { signal: abort.signal, runId: request_id });
  } catch (error) { return json({ error: safeError(error) }, error instanceof GatewayError ? error.httpStatus ?? 503 : 503); }
  const encoder = new TextEncoder();
  const body = new ReadableStream({
    async start(controller) {
      const send = (event: object) => controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      let answer = ''; let complete = false;
      try {
        send({ type: 'accepted', id: saved.data.id });
        for await (const event of stream) {
          if (event.type === 'response.output_text.delta' || event.type === 'response.refusal.delta') {
            answer += event.delta; send({ type: 'delta', text: event.delta });
          }
          if (event.type === 'response.completed') complete = true;
        }
        if (!complete || !answer.trim()) throw new Error('Incomplete response');
        const stored = await admin.from('advisor_messages').insert({ user_id: uid, role: 'assistant', content: answer, request_id }).select('id').single();
        if (stored.error) { send({ type: 'error', error: 'پاسخ نمایش داده شد اما ذخیره نشد؛ گفتگو را نبند.' }); }
        else send({ type: 'done', id: stored.data.id });
      } catch (error) { if (!abort.signal.aborted) send({ type: 'error', error: safeError(error) }); }
      finally { try { controller.close(); } catch { /* Consumer cancelled. */ } }
    },
    cancel() { abort.abort(); },
  });
  return new Response(body, { headers: { ...corsHeaders, 'Content-Type': 'application/x-ndjson', 'Cache-Control': 'no-cache' } });
});