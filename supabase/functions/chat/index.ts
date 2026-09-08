import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const GROQ_KEY = Deno.env.get('GROQ_API_KEY');
const SB_URL = Deno.env.get('SUPABASE_URL');
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!GROQ_KEY) console.error('Missing GROQ_API_KEY');
if (!SB_URL) console.error('Missing SUPABASE_URL');
if (!SB_KEY) console.error('Missing SUPABASE_SERVICE_ROLE_KEY');

const ok = !!(GROQ_KEY && SB_URL && SB_KEY);

const ALLOW = ['https://tipu.vercel.app', 'http://localhost:5173', 'http://localhost:4173'];

function hdrs(origin: string | null) {
  const o = origin && ALLOW.includes(origin) ? origin : ALLOW[0];
  return {
    'Access-Control-Allow-Origin': o,
    'Access-Control-Allow-Headers': 'authorization,x-client-info,apikey,content-type',
    'Access-Control-Allow-Methods': 'POST,OPTIONS,GET,DELETE,PUT',
  };
}

function j(h: Record<string, string>, b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...h, 'Content-Type': 'application/json' } });
}

function stripFences(t: string) { return t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim(); }

async function auth(req: Request, h: Record<string, string>) {
  const sb = createClient(SB_URL!, SB_KEY!);
  const a = req.headers.get('Authorization');
  if (!a) return { sb, user: null, err: j(h, { error: 'No auth' }, 401) };
  const { data: { user }, error } = await sb.auth.getUser(a.replace('Bearer ', ''));
  if (error || !user) return { sb, user: null, err: j(h, { error: 'Unauthorized' }, 401) };
  return { sb, user, err: null };
}

Deno.serve(async (req) => {
  const h = hdrs(req.headers.get('Origin'));
  if (req.method === 'OPTIONS') return new Response('ok', { headers: h });
  if (!ok) return j(h, { error: 'Config error' }, 500);

  try {
    const url = new URL(req.url);

    // ── GET ──────────────────────────────────────────────────────
    if (req.method === 'GET') {
      const { sb, user, err } = await auth(req, h);
      if (err) return err;
      const section = url.searchParams.get('section');

      if (section === 'memories') {
        const cat = url.searchParams.get('category');
        let q = sb.from('memory_facts')
          .select('id, fact, category, importance, confidence, status, created_at, updated_at')
          .eq('user_id', user!.id).eq('status', 'active')
          .order('importance', { ascending: false }).limit(100);
        if (cat) q = q.eq('category', cat);
        const { data, error } = await q;
        if (error) throw error;
        return j(h, { memories: data || [] });
      }

      const off = parseInt(url.searchParams.get('offset') || '0', 10);
      const lim = parseInt(url.searchParams.get('limit') || '20', 10);
      const { data, error } = await sb.from('messages')
        .select('id, role, content, created_at')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(off, off + lim - 1);
      if (error) throw error;
      return j(h, { messages: data || [], hasMore: (data?.length || 0) === lim });
    }

    // ── Read body ────────────────────────────────────────────────
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch { /* no body */ }

    const { sb, user, err } = await auth(req, h);
    if (err) return err;

    // ── PUT: update memory ──────────────────────────────────────
    if (req.method === 'PUT' && body.memoryId) {
      const u: Record<string, unknown> = {};
      if (body.fact !== undefined) u.fact = body.fact;
      if (body.category !== undefined) u.category = body.category;
      if (body.importance !== undefined) u.importance = Math.max(0, Math.min(100, body.importance));
      if (body.confidence !== undefined) u.confidence = Math.max(0, Math.min(100, body.confidence));
      if (body.status !== undefined) u.status = body.status;
      const { data, error } = await sb.from('memory_facts').update(u).eq('id', body.memoryId).eq('user_id', user!.id).select().single();
      if (error) throw error;
      return j(h, { memory: data });
    }

    // ── DELETE ───────────────────────────────────────────────────
    if (req.method === 'DELETE') {
      if (body.memoryId) {
        const { error } = body.archive
          ? await sb.from('memory_facts').update({ status: 'archived' }).eq('id', body.memoryId).eq('user_id', user!.id)
          : await sb.from('memory_facts').delete().eq('id', body.memoryId).eq('user_id', user!.id);
        if (error) throw error;
        return j(h, { success: true });
      }
      if (body.messageId) {
        const { error } = await sb.from('messages').delete().eq('id', body.messageId).eq('user_id', user!.id);
        if (error) throw error;
        return j(h, { success: true });
      }
      return j(h, { error: 'messageId or memoryId required' }, 400);
    }

    // ── POST: chat ──────────────────────────────────────────────
    if (req.method === 'POST') {
      const message = (body.message as string) || '';
      if (!message.trim()) return j(h, { error: 'Empty message' }, 400);

      const { data: hist } = await sb.from('messages')
        .select('role, content').eq('user_id', user!.id)
        .order('created_at', { ascending: false }).limit(5);

      const { data: mems } = await sb.from('memory_facts')
        .select('fact, category, importance').eq('user_id', user!.id).eq('status', 'active')
        .order('importance', { ascending: false }).limit(15);

      const memText = (mems || []).length > 0
        ? '\n\nKnown facts:\n' + (mems as Array<{ fact: string; category: string; importance: number }>).map(m => `- [${m.category}] ${m.fact}`).join('\n')
        : '';

      const sysPrompt = `You are Tipu, a personal AI companion. Warm, friendly, conversational. Keep responses concise (2-3 sentences). Don't over-explain. Use casual language.${memText}`;

      const msgs = [
        { role: 'system', content: sysPrompt },
        ...(hist || []).reverse().map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
        { role: 'user', content: message },
      ];

      const ctrl = new AbortController();
      const tid = setTimeout(() => ctrl.abort(), 25000);

      const gr = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
        body: JSON.stringify({ model: 'groq/compound', messages: msgs, max_tokens: 1024, temperature: 0.7 }),
        signal: ctrl.signal,
      });
      clearTimeout(tid);

      if (!gr.ok) {
        const e = await gr.json().catch(() => ({}));
        throw new Error(`Groq ${gr.status}`);
      }

      const d = await gr.json();
      const reply = d?.choices?.[0]?.message?.content?.trim() || 'No reply';

      const t1 = new Date().toISOString();
      const t2 = new Date(Date.now() + 1000).toISOString();
      await sb.from('messages').insert([
        { user_id: user!.id, role: 'user', content: message, created_at: t1 },
        { user_id: user!.id, role: 'assistant', content: reply, created_at: t2 },
      ]);

      return j(h, { reply });
    }

    return j(h, { error: 'Not allowed' }, 405);
  } catch (err) {
    console.error('ERR:', err instanceof Error ? err.message : err);
    return j(h, { error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});