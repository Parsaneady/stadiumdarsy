import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { listModels, GatewayError } from 'npm:@lovable.dev/ai-gateway@0.1.11';

Deno.serve(async (req) => {
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  if (req.method === 'OPTIONS') return new Response('ok', { headers });
  const authorization = req.headers.get('Authorization');
  if (!authorization) return new Response(JSON.stringify({ error: 'نیاز به ورود دارید.' }), { status: 401, headers });
  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authorization } } });
  const { data, error } = await client.auth.getUser();
  if (error || !data.user) return new Response(JSON.stringify({ error: 'نشست معتبر نیست.' }), { status: 401, headers });
  try {
    const catalog = await listModels();
    return new Response(JSON.stringify(catalog), { headers });
  } catch (error) {
    return new Response(JSON.stringify({ error: 'اتصال مشاور هنوز آماده نیست.', code: error instanceof GatewayError ? error.code : 'application_error' }), { status: 503, headers });
  }
});