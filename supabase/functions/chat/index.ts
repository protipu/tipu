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

const EXTRACTION_CATEGORIES = [
  'identity', 'background', 'relationships', 'work', 'health',
  'interests', 'values', 'communication', 'preferences', 'projects', 'other',
];

const EXTRACTION_PROMPT = `You are a memory extraction engine. Analyze the user's message for durable, specific facts.

Return ONLY valid JSON — no markdown, no explanation.
Extract facts that are:
- Specific and verifiable (not generic like "is friendly")
- Durable (won't change day-to-day)
- Directly stated by the user
- NOT generic traits, opinions about AI, questions, or test messages

Output: {"memories": [{"fact": "...", "category": "identity|background|relationships|work|health|interests|values|communication|preferences|projects|other", "importance": 50, "confidence": 50}]}

Importance (1-100):
- 70+: Core identity (name, pronouns, gender)
- 40-69: Stable facts (job, city, family)
- 10-39: Preferences, projects, interests

Confidence (1-100):
- 90+: Explicitly stated ("My name is X")
- 50-89: Strongly implied ("I work at X" = has job at X)
- 10-49: Indirectly implied

If nothing worth remembering, return: {"memories": []}`;

async function extractAndSaveMemories(
  sb: ReturnType<typeof createClient>,
  userId: string,
  userMessage: string,
  userMsgId?: string,
): Promise<void> {
  try {
    const extrCtrl = new AbortController();
    const extrTid = setTimeout(() => extrCtrl.abort(), 10000);

    const extrRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_KEY}` },
      body: JSON.stringify({
        model: 'groq/llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: EXTRACTION_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 512,
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
      signal: extrCtrl.signal,
    });
    clearTimeout(extrTid);

    if (!extrRes.ok) {
      console.error('Extraction API error:', extrRes.status);
      return;
    }

    const extrData = await extrRes.json();
    const content = extrData?.choices?.[0]?.message?.content?.trim();
    if (!content) return;

    let parsed: { memories: Array<{ fact: string; category: string; importance: number; confidence: number }> };
    try {
      parsed = JSON.parse(content);
    } catch {
      console.error('Failed to parse extraction JSON:', content);
      return;
    }

    if (!parsed.memories || !Array.isArray(parsed.memories) || parsed.memories.length === 0) return;

    const toSave = parsed.memories
      .filter(m => m.fact && EXTRACTION_CATEGORIES.includes(m.category))
      .map(m => ({
        user_id: userId,
        fact: m.fact.trim(),
        category: m.category,
        importance: Math.max(0, Math.min(100, Math.round(m.importance || 50))),
        confidence: Math.max(0, Math.min(100, Math.round(m.confidence || 50))),
        source_message_id: userMsgId || null,
        status: 'active',
      }));

    if (toSave.length === 0) return;

    const deduped = await deduplicateMemories(sb, userId, toSave);
    if (deduped.length > 0) {
      const { error } = await sb.from('memory_facts').insert(deduped);
      if (error) console.error('Memory insert error:', error.message);
      else console.log(`Saved ${deduped.length} memories from ${toSave.length} extracted`);
    }
  } catch (err) {
    console.error('extractAndSaveMemories error:', err instanceof Error ? err.message : err);
  }
}

async function deduplicateMemories(
  sb: ReturnType<typeof createClient>,
  userId: string,
  candidates: Array<{ user_id: string; fact: string; category: string; importance: number; confidence: number; source_message_id: string | null; status: string }>,
): Promise<typeof candidates> {
  const { data: existing } = await sb.from('memory_facts')
    .select('id, fact, category, importance')
    .eq('user_id', userId)
    .eq('status', 'active');

  if (!existing || existing.length === 0) return candidates;

  const kept: typeof candidates = [];
  for (const cand of candidates) {
    let superseded = false;
    for (const ex of existing) {
      const sim = similarity(cand.fact.toLowerCase(), ex.fact.toLowerCase());
      if (sim > 0.9) {
        superseded = true;
        break;
      }
      if (sim > 0.6 && cand.category === ex.category) {
        if (cand.importance > ex.importance) {
          await sb.from('memory_facts').update({ status: 'superseded' }).eq('id', ex.id);
        } else {
          superseded = true;
          break;
        }
      }
    }
    if (!superseded) kept.push(cand);
  }
  return kept;
}

function similarity(a: string, b: string): number {
  const wordsA = a.split(/\s+/);
  const wordsB = b.split(/\s+/);
  const setB = new Set(wordsB);
  let matches = 0;
  for (const w of wordsA) { if (setB.has(w)) matches++; }
  return matches / Math.max(wordsA.length, wordsB.length);
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

      const lowMsg = message.toLowerCase().trim();
      const isGreeting = /^(hi|hey|hello|sup|yo|hiya|howdy|hola|assalamu|salaam|good\s*(morning|afternoon|evening|night)|what'?s?\s*up|how\s*are\s*you|how'?s?\s*it\s*going|kemon\s*acho|ki\s*khobor)[\s!?.]*$/i.test(lowMsg);
      const isShort = lowMsg.split(/\s+/).length <= 3;

      let memText = '';
      if (!isGreeting && !isShort) {
        const { data: mems } = await sb.from('memory_facts')
          .select('fact, category, importance').eq('user_id', user!.id).eq('status', 'active')
          .order('importance', { ascending: false }).limit(5);
        if (mems && mems.length > 0) {
          memText = '\n\nPrivate notes (use only if directly relevant — never dump all of these):\n' +
            (mems as Array<{ fact: string }>).map(m => m.fact).join('\n');
        }
      }

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

      const langInstruction = langName
        ? `\n\nIMPORTANT: The user prefers ${langName}. Respond in ${langName} when they write in ${langName} or when it's clearly their preference.`
        : '';

      const sysPrompt = `You are Tipu — a close friend who texts casually. Warm, direct, real.

CRITICAL RULES — break these and you fail:
1. MOST REPLIES MUST BE 1-3 SHORT SENTENCES. Like texting a friend. Not an essay.
2. NEVER dump all your knowledge about the user. They know what they told you.
3. NEVER say "Here's a full recap" or summarize everything you know unless explicitly asked.
4. When someone says "hi", "hey", "what's up" — just say hi back. One sentence. Like a friend would.
5. Don't use tables, bullet points, or headings unless the user specifically asks for a breakdown or list.
6. Don't use markdown formatting (bold, headers, etc.) in normal conversation.
7. Don't say "How can I help?" or "Let me know if you need anything" — just talk naturally.
8. Match their energy. Short message = short reply. Detailed question = detailed answer.
9. If they mention something you know about, reference it casually in your reply, don't dump the full record.
10. You are NOT a personal assistant reading from a file. You're a friend who remembers things.
${langInstruction}${memText ? '\n\nYour private notes about the user (NEVER read these out — use them to have context, not to dump):\n' + memText : ''}`;

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
      const { data: savedMsgs } = await sb.from('messages').insert([
        { user_id: user!.id, role: 'user', content: message, created_at: t1 },
        { user_id: user!.id, role: 'assistant', content: reply, created_at: t2 },
      ]).select('id, role');

      const userMsgId = savedMsgs?.[0]?.id;

      // ── Memory extraction (background, non-blocking) ────────────
      extractAndSaveMemories(sb, user!.id, message, userMsgId).catch(e =>
        console.error('Memory extraction failed:', e instanceof Error ? e.message : e)
      );

      return j(h, { reply });
    }

    return j(h, { error: 'Not allowed' }, 405);
  } catch (err) {
    console.error('ERR:', err instanceof Error ? err.message : err);
    return j(h, { error: err instanceof Error ? err.message : 'Unknown error' }, 500);
  }
});
