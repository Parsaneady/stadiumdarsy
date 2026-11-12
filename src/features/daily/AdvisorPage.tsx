import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Conversation, ConversationContent, ConversationScrollButton } from '@/components/ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from '@/components/ai-elements/prompt-input';
import { Shimmer } from '@/components/ai-elements/shimmer';
import type { UIMessage } from 'ai';
import { z } from 'zod';

const eventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('accepted'), id: z.string() }),
  z.object({ type: z.literal('delta'), text: z.string() }),
  z.object({ type: z.literal('done'), id: z.string() }),
  z.object({ type: z.literal('error'), error: z.string() }),
]);
const messageSchema = z.string().trim().min(1).max(4000);

export default function AdvisorPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [text, setText] = useState('');
  const [status, setStatus] = useState<'ready'|'submitted'|'streaming'>('ready');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const input = useRef<HTMLTextAreaElement>(null);
  const active = useRef<AbortController | null>(null);
  useEffect(() => {
    let mounted = true;
    setMessages([]); setLoading(true); setError('');
    if (!user) { setLoading(false); return; }
    supabase.from('advisor_messages').select('id,role,content').eq('user_id', user.id).order('created_at', { ascending: true }).then(result => {
      if (!mounted) return;
      if (result.error) setError('سابقهٔ گفتگو بارگیری نشد؛ برای جلوگیری از گم‌شدن گفتگو صفحه را دوباره باز کن.');
      else setMessages((result.data ?? []).map(m => ({ id: m.id, role: m.role === 'assistant' ? 'assistant' : 'user', parts: [{ type: 'text', text: m.content }] })));
      setLoading(false); input.current?.focus();
    });
    return () => { mounted = false; active.current?.abort(); };
  }, [user?.id]);

  async function send(value: string) {
    const parsed = messageSchema.safeParse(value);
    if (!parsed.success || !user || loading || active.current) return;
    const requestId = crypto.randomUUID(); const assistantId = crypto.randomUUID();
    const controller = new AbortController(); active.current = controller;
    setError(''); setText(''); setStatus('submitted');
    setMessages(m => [...m, { id: requestId, role: 'user', parts: [{ type: 'text', text: parsed.data }] }]);
    input.current?.focus();
    let accepted = false;
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) throw new Error('ابتدا وارد حسابت شو.');
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/study-advisor`, {
        method: 'POST', headers: { Authorization: `Bearer ${session.session.access_token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: parsed.data, request_id: requestId }), signal: controller.signal,
      });
      if (!response.ok) {
        const failure = await response.json(); throw new Error(typeof failure.error === 'string' ? failure.error : 'مشاور در دسترس نیست.');
      }
      const reader = response.body?.getReader(); if (!reader) throw new Error('پاسخ قابل دریافت نیست.');
      const decoder = new TextDecoder(); let buffer = ''; let answer = ''; let done = false;
      while (true) {
        const chunk = await reader.read(); buffer += decoder.decode(chunk.value, { stream: !chunk.done });
        const lines = buffer.split('\n'); buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.trim()) continue;
          const event = eventSchema.parse(JSON.parse(line));
          if (event.type === 'accepted') accepted = true;
          if (event.type === 'error') throw new Error(event.error);
          if (event.type === 'done') done = true;
          if (event.type === 'delta') {
            answer += event.text; setStatus('streaming');
            const snapshot = answer;
            setMessages(m => [...m.filter(x => x.id !== assistantId), { id: assistantId, role: 'assistant', parts: [{ type: 'text', text: snapshot }] }]);
          }
        }
        if (chunk.done) break;
      }
      if (!done) throw new Error('پاسخ کامل نشد؛ درخواست خودکار تکرار نمی‌شود.');
    } catch (failure) {
      if (controller.signal.aborted) setError('پاسخ متوقف شد؛ بخش ناتمام در سابقه ذخیره نمی‌شود.');
      else setError(failure instanceof Error ? failure.message : 'پاسخ دریافت نشد.');
      if (!accepted) setText(parsed.data);
    } finally { active.current = null; setStatus('ready'); input.current?.focus(); }
  }

  return <section className="mx-auto flex w-full max-w-3xl flex-col gap-5" dir="rtl">
    <header className="flex items-center gap-3 border-b border-border pb-5">
      <svg role="img" aria-label="نشان همراه" viewBox="0 0 48 48" className="h-12 w-12 shrink-0 text-primary" fill="none"><circle cx="24" cy="24" r="21" stroke="currentColor" strokeWidth="2"/><path d="m31 15-4 13-11 5 4-13 11-5Z" stroke="currentColor" strokeWidth="2"/><circle cx="24" cy="24" r="2" fill="currentColor"/></svg>
      <div><h1 className="font-display text-3xl">همراه · مشاور درسی</h1><p className="mt-1 text-sm text-muted-foreground">یک قدم روشن‌تر، بدون فشار اضافه</p></div>
    </header>
    <Conversation className="h-[55dvh] min-h-72">
      <ConversationContent className="gap-6 px-0">
        {loading && <Shimmer>در حال دریافت گفتگو…</Shimmer>}
        {!loading && !messages.length && <div className="py-12"><h2 className="mb-3 font-display text-2xl">امروز از کجا شروع کنیم؟</h2><p className="text-muted-foreground">انرژی‌ات چطور است؟ چه چیزی در درس‌ها بیشتر درگیرت کرده؟</p><div className="mt-6 flex flex-wrap gap-2">{['عملکرد امروزم را بررسی کن','برای ادامهٔ امروز پیشنهاد بده','خسته‌ام و تمرکز ندارم'].map(s => <Button key={s} variant="outline" onClick={() => send(s)} disabled={status !== 'ready'}>{s}</Button>)}</div></div>}
        {messages.map(m => <Message key={m.id} from={m.role}><MessageContent className={m.role === 'user' ? 'bg-primary text-primary-foreground group-[.is-user]:bg-primary group-[.is-user]:text-primary-foreground' : 'w-full'}>{m.parts.map((part,i) => part.type === 'text' ? <MessageResponse key={i}>{part.text}</MessageResponse> : null)}</MessageContent></Message>)}
        {status === 'submitted' && <Shimmer>همراه در حال بررسی است…</Shimmer>}
      </ConversationContent><ConversationScrollButton />
    </Conversation>
    {error && <p role="alert" className="text-sm leading-7 text-destructive">{error}</p>}
    <PromptInput onSubmit={({text: value}) => { void send(value); }} className="bg-card">
      <PromptInputTextarea ref={input} autoFocus aria-label="پیام به مشاور" placeholder="پیامت را برای همراه بنویس…" value={text} onChange={e => setText(e.target.value)} maxLength={4000} disabled={loading} className="min-h-24 text-base" />
      <PromptInputFooter className="justify-end"><PromptInputSubmit status={status} disabled={loading || (status === 'ready' && !text.trim())} onStop={() => active.current?.abort()} aria-label={status === 'ready' ? 'ارسال پیام' : 'توقف پاسخ'} /></PromptInputFooter>
    </PromptInput>
  </section>;
}
