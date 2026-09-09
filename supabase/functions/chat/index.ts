import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const GROQ_KEY = Deno.env.get('GROQ_API_KEY');
const SB_URL = Deno.env.get('SUPABASE_URL');
const SB_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!GROQ_KEY) console.error('Missing GROQ_API_KEY');
if (!SB_URL) console.error('Missing SUPABASE_URL');
if (!SB_KEY) console.error('Missing SUPABASE_SERVICE_ROLE_KEY');

const ok = !!(GROQ_KEY && SB_URL && SB_KEY);

const ALLOW = ['https://tipu.vercel.app', 'https://tipu-pearl.vercel.app', 'https://tipu.mithebangla.store', 'http://localhost:5173', 'http://localhost:4173'];

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

      // Read language preference from memory_facts
      const { data: langPrefs } = await sb.from('memory_facts')
        .select('fact').eq('user_id', user!.id).eq('category', 'preference')
        .eq('status', 'active').ilike('fact', '%language%').limit(3);

      let langName = '';
      if (langPrefs && langPrefs.length > 0) {
        const fact = langPrefs[0].fact.toLowerCase();
        const langs: Record<string, string> = {
          bengali: 'Bengali', bangla: 'Bengali', 'বাংলা': 'Bengali',
          spanish: 'Spanish', french: 'French', arabic: 'Arabic',
          hindi: 'Hindi', urdu: 'Urdu', chinese: 'Chinese',
          japanese: 'Japanese', korean: 'Korean', portuguese: 'Portuguese',
        };
        for (const [key, val] of Object.entries(langs)) {
          if (fact.includes(key)) { langName = val; break; }
        }
      }

      const memText = (mems || []).length > 0
        ? '\n\nKnown facts about the user:\n' + (mems as Array<{ fact: string; category: string; importance: number }>).map(m => `- [${m.category}] ${m.fact}`).join('\n')
        : '';

      const langInstruction = langName
        ? `\n\nIMPORTANT: The user prefers ${langName}. Respond in ${langName} when they write in ${langName} or when it's clearly their preference.`
        : '';

      const sysPrompt = `You are Tipu — a warm, friendly AI companion, like a close friend who genuinely cares.

Rules:
- Be concise. Reply like a person texting, not a document. A few sentences by default. Only go longer if the user explicitly asks for a breakdown, list, or structured data.
- Don't recap the conversation or summarize what they said. Just respond naturally to what they asked.
- Don't re-explain or re-calculate everything from scratch on every reply. Reference past context silently to stay accurate, but don't restate the whole history.
- Use markdown ONLY for genuinely tabular data (spending ledgers, comparisons). Most replies should be plain conversational text — no headings, no bullet-point recaps for simple questions.
- Match the user's energy: casual if they're casual, serious if they're serious.
- Never end with generic closings like "How can I help?" — just end naturally.
- When the user mentions expenses, amounts, or quantities, keep your reply short and direct. "You've had 2 beers this month" not "Here's everything we've discussed about your drinking habits..."
${langInstruction}${memText}`;

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
        if (gr.status === 429) {
          return j(h, {
            error: 'Tipu is a bit busy right now. Try again in a moment!',
            rateLimited: true,
          }, 429);
        }
        const e = await gr.json().catch(() => ({}));
        throw new Error(`Groq ${gr.status}: ${JSON.stringify(e)}`);
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
