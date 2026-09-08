import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

// ── Configuration ──────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = [
  'https://tipu.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

const CHAT_MODEL = Deno.env.get('CHAT_MODEL') || 'groq/compound';
const MEMORY_MODEL = Deno.env.get('MEMORY_MODEL') || 'groq/compound';
const MAX_MESSAGE_LENGTH = 4000;
const AI_CONTEXT_LIMIT = 5;
const HISTORY_PAGE_SIZE = 20;
const FACTS_CONTEXT_LIMIT = 15;

// ── Environment validation ─────────────────────────────────────────────────

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!GROQ_API_KEY) console.error('FATAL: GROQ_API_KEY not set');
if (!SUPABASE_URL) console.error('FATAL: SUPABASE_URL not set');
if (!SUPABASE_SERVICE_KEY) console.error('FATAL: SUPABASE_SERVICE_ROLE_KEY not set');

const configOk = !!(GROQ_API_KEY && SUPABASE_URL && SUPABASE_SERVICE_KEY);

// ── CORS ───────────────────────────────────────────────────────────────────

function getCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = origin && ALLOWED_ORIGINS.includes(origin)
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, DELETE, PUT',
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function json(corsHeaders: Record<string, string>, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function stripMarkdownFences(text: string): string {
  return text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

// ── Auth ───────────────────────────────────────────────────────────────────

async function authenticateUser(req: Request, corsHeaders: Record<string, string>) {
  const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_KEY!);
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return { supabase: null, user: null, error: json(corsHeaders, { error: 'Missing Authorization header' }, 401) };
  }
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return { supabase: null, user: null, error: json(corsHeaders, { error: 'Unauthorized' }, 401) };
  }
  return { supabase, user, error: null };
}

// ── Handlers ───────────────────────────────────────────────────────────────

async function handleGetHistory(req: Request, corsHeaders: Record<string, string>) {
  try {
    const { supabase, user, error: authResp } = await authenticateUser(req, corsHeaders);
    if (authResp) return authResp;

    const url = new URL(req.url);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);
    const limit = parseInt(url.searchParams.get('limit') || String(HISTORY_PAGE_SIZE), 10);

    const { data: messages, error } = await supabase!
      .from('messages')
      .select('id, role, content, created_at')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return json(corsHeaders, { messages: messages || [], hasMore: messages?.length === limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Get history error:', msg);
    return json(corsHeaders, { error: msg }, 500);
  }
}

async function handleDeleteMessage(req: Request, corsHeaders: Record<string, string>) {
  try {
    const { supabase, user, error: authResp } = await authenticateUser(req, corsHeaders);
    if (authResp) return authResp;

    const body = await req.json();
    const { messageId } = body;

    if (!messageId) {
      return json(corsHeaders, { error: 'messageId required' }, 400);
    }

    const { error } = await supabase!
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user!.id);

    if (error) throw error;

    return json(corsHeaders, { success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Delete message error:', msg);
    return json(corsHeaders, { error: msg }, 500);
  }
}

async function handleGetMemories(req: Request, corsHeaders: Record<string, string>) {
  try {
    const { supabase, user, error: authResp } = await authenticateUser(req, corsHeaders);
    if (authResp) return authResp;

    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const status = url.searchParams.get('status') || 'active';
    const limit = parseInt(url.searchParams.get('limit') || '100', 10);

    let query = supabase!
      .from('memory_facts')
      .select('id, fact, category, importance, confidence, status, source_message_id, superseded_by, created_at, updated_at')
      .eq('user_id', user!.id)
      .eq('status', status)
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(limit);

    if (category) {
      query = query.eq('category', category);
    }

    const { data: memories, error } = await query;

    if (error) throw error;

    return json(corsHeaders, { memories: memories || [] });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Get memories error:', msg);
    return json(corsHeaders, { error: msg }, 500);
  }
}

async function handleUpdateMemory(req: Request, corsHeaders: Record<string, string>) {
  try {
    const { supabase, user, error: authResp } = await authenticateUser(req, corsHeaders);
    if (authResp) return authResp;

    const body = await req.json();
    const { memoryId, fact, category, importance, confidence, status } = body;

    if (!memoryId) {
      return json(corsHeaders, { error: 'memoryId required' }, 400);
    }

    const updates: Record<string, unknown> = {};
    if (fact !== undefined) updates.fact = fact;
    if (category !== undefined) updates.category = category;
    if (importance !== undefined) updates.importance = Math.max(0, Math.min(100, importance));
    if (confidence !== undefined) updates.confidence = Math.max(0, Math.min(100, confidence));
    if (status !== undefined) updates.status = status;

    const { data: memory, error } = await supabase!
      .from('memory_facts')
      .update(updates)
      .eq('id', memoryId)
      .eq('user_id', user!.id)
      .select('id, fact, category, importance, confidence, status, updated_at')
      .single();

    if (error) throw error;

    return json(corsHeaders, { memory });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Update memory error:', msg);
    return json(corsHeaders, { error: msg }, 500);
  }
}

async function handleDeleteMemory(req: Request, corsHeaders: Record<string, string>) {
  try {
    const { supabase, user, error: authResp } = await authenticateUser(req, corsHeaders);
    if (authResp) return authResp;

    const body = await req.json();
    const { memoryId, archive } = body;

    if (!memoryId) {
      return json(corsHeaders, { error: 'memoryId required' }, 400);
    }

    if (archive) {
      const { error } = await supabase!
        .from('memory_facts')
        .update({ status: 'archived' })
        .eq('id', memoryId)
        .eq('user_id', user!.id);

      if (error) throw error;
    } else {
      const { error } = await supabase!
        .from('memory_facts')
        .delete()
        .eq('id', memoryId)
        .eq('user_id', user!.id);

      if (error) throw error;
    }

    return json(corsHeaders, { success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Delete memory error:', msg);
    return json(corsHeaders, { error: msg }, 500);
  }
}

async function handlePostMessage(req: Request, corsHeaders: Record<string, string>) {
  try {
    const { supabase, user, error: authResp } = await authenticateUser(req, corsHeaders);
    if (authResp) return authResp;

    const body = await req.json();
    const { message } = body;

    if (!message?.trim()) {
      return json(corsHeaders, { error: 'Message required' }, 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return json(corsHeaders, { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }, 400);
    }

    // Load last 5 messages for AI context
    const { data: history } = await supabase!
      .from('messages')
      .select('role, content')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(AI_CONTEXT_LIMIT);

    // Load relevant memories sorted by importance
    const { data: facts } = await supabase!
      .from('memory_facts')
      .select('fact, category, importance')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .order('importance', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(FACTS_CONTEXT_LIMIT);

    const factsText = (facts || []).length > 0
      ? `\n\nKnown facts about the user:\n${(facts || []).map((f: { fact: string; category: string; importance: number }) => `- [${f.category || 'general'}] ${f.fact} (importance: ${f.importance || 50})`).join('\n')}`
      : '';

    const systemPrompt = `You are Tipu, a personal AI companion. You are warm, friendly, and conversational — like a close friend who remembers things about the user's life. You don't use formal language, you don't lecture, and you don't act like a customer service bot. You're genuinely interested and you remember what the user tells you.

IMPORTANT RULES:
- Keep responses natural and concise (2-3 sentences max unless asked for detail)
- Don't over-explain or lecture
- Use casual, warm language
- If you learn something new about the user, acknowledge it briefly
- Never say "I don't have access to..." or similar — just use what you know${factsText}`;

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).reverse().map(m => ({ role: m.role, content: m.content })),
      { role: 'user', content: message },
    ];

    console.log('Calling Groq API...');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    const groqResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: CHAT_MODEL,
          messages: groqMessages,
          max_tokens: 1024,
          temperature: 0.7,
          top_p: 0.9,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);
    console.log('Groq status:', groqResponse.status);

    if (!groqResponse.ok) {
      const err = await groqResponse.json().catch(() => ({}));
      console.error('Groq error:', err);
      throw new Error(`Groq ${groqResponse.status}: ${JSON.stringify(err)}`);
    }

    const data = await groqResponse.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || 'No reply';
    console.log('Reply:', reply.substring(0, 50));

    // Save messages with distinct timestamps
    const userTime = new Date().toISOString();
    const assistantTime = new Date(Date.now() + 1000).toISOString();

    const { data: insertedMessages, error: saveError } = await supabase!
      .from('messages')
      .insert([
        { user_id: user!.id, role: 'user', content: message, created_at: userTime },
        { user_id: user!.id, role: 'assistant', content: reply, created_at: assistantTime },
      ])
      .select('id, role');

    if (saveError) console.error('Save messages error:', saveError);

    // Extract and save facts with deduplication
    const userMsgId = insertedMessages?.find((m: { id: string; role: string }) => m.role === 'user')?.id;

    if (userMsgId) {
      extractAndSaveFacts(supabase!, user!.id, userMsgId, message, reply);
    }

    return json(corsHeaders, { reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Function error:', msg);
    return json(corsHeaders, { error: msg }, 500);
  }
}

// ── Fact Extraction ────────────────────────────────────────────────────────

async function extractAndSaveFacts(
  supabase: Record<string, unknown>,
  userId: string,
  sourceMessageId: string,
  userMessage: string,
  assistantReply: string
) {
  try {
    console.log('Extracting facts from exchange...');

    const factPrompt = `Given this conversation exchange, extract durable facts about the user.

User: ${userMessage}
Assistant: ${assistantReply}

Return a JSON array of facts (0-3 facts). Each fact should have:
- "fact": short factual statement about the user (max 200 chars)
- "category": one of: personal, preference, work, people, relationship, goal, project, event, habit, health
- "importance": 1-100 (how important is this to know about the user)
- "confidence": 1-100 (how sure are you this is a durable fact vs one-time statement)

Only include facts that are:
1. Durable (will be true tomorrow, not just today)
2. Specific to the user (not general knowledge)
3. Not already obvious from context

Return ONLY valid JSON array, no markdown fences.
Example: [{"fact":"User works at Google","category":"work","importance":80,"confidence":90}]`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const factResponse = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: MEMORY_MODEL,
          messages: [
            { role: 'system', content: 'You extract durable facts from conversations. Return only valid JSON arrays.' },
            { role: 'user', content: factPrompt },
          ],
          max_tokens: 500,
          temperature: 0.3,
          top_p: 0.9,
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeoutId);

    if (!factResponse.ok) {
      console.error('Fact extraction API error:', factResponse.status);
      return;
    }

    const factData = await factResponse.json();
    const factText = factData?.choices?.[0]?.message?.content?.trim();

    if (!factText) return;

    const cleanJson = stripMarkdownFences(factText);

    let facts: Array<{ fact: string; category: string; importance: number; confidence: number }>;
    try {
      const parsed = JSON.parse(cleanJson);
      facts = Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      console.error('Failed to parse fact JSON:', cleanJson);
      return;
    }

    for (const fact of facts) {
      if (!fact.fact || fact.fact.length < 5) continue;

      const category = fact.category || 'general';
      const importance = Math.max(1, Math.min(100, fact.importance || 50));
      const confidence = Math.max(1, Math.min(100, fact.confidence || 80));

      if (confidence < 50) {
        console.log('Skipping low-confidence fact:', fact.fact);
        continue;
      }

      // Check for similar existing memory
      const { data: existingFacts } = await (supabase as { from: (table: string) => { select: (cols: string) => { eq: (col: string, val: string) => { eq: (col: string, val: string) => { eq: (col: string, val: string) => { order: (col: string, opts: { ascending: boolean }) => { limit: (n: number) => Promise<{ data: Array<{ id: string; fact: string; category: string; importance: number; confidence: number }> | null }> } } } } } } }).from('memory_facts')
        .select('id, fact, category, importance, confidence')
        .eq('user_id', userId)
        .eq('status', 'active')
        .eq('category', category)
        .order('created_at', { ascending: false })
        .limit(20);

      let bestMatch: { id: string; fact: string; importance: number } | null = null;

      if (existingFacts && existingFacts.length > 0) {
        const newWords = new Set(fact.fact.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3));
        let bestScore = 0;

        for (const existing of existingFacts) {
          const factWords = existing.fact.toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
          const overlap = factWords.filter((w: string) => newWords.has(w)).length;
          const score = overlap / Math.max(newWords.size, factWords.length, 1);
          if (score > bestScore && score > 0.5) {
            bestScore = score;
            bestMatch = existing;
          }
        }
      }

      if (bestMatch) {
        if (importance > bestMatch.importance) {
          await (supabase as { from: (table: string) => { update: (data: Record<string, unknown>) => { eq: (col: string, val: string) => Promise<{ error: unknown }> } } }).from('memory_facts')
            .update({
              fact: fact.fact,
              importance,
              confidence,
              source_message_id: sourceMessageId,
            })
            .eq('id', bestMatch.id);
          console.log('Updated existing memory:', bestMatch.id, '→', fact.fact);
        } else {
          console.log('Skipped duplicate:', fact.fact);
        }
      } else {
        const { error: factError } = await (supabase as { from: (table: string) => { insert: (data: Record<string, unknown>) => Promise<{ error: unknown }> } }).from('memory_facts')
          .insert({
            user_id: userId,
            fact: fact.fact,
            category,
            importance,
            confidence,
            source_message_id: sourceMessageId,
            status: 'active',
          });

        if (factError) {
          console.error('Save fact error:', factError);
        } else {
          console.log('New memory saved:', fact.fact, '|', category, '|', importance);
        }
      }
    }
  } catch (err) {
    console.error('Fact extraction error:', err);
  }
}

// ── Router ─────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!configOk) {
    return json(corsHeaders, { error: 'Server configuration error' }, 500);
  }

  const url = new URL(req.url);
  const section = url.searchParams.get('section');

  // IMPORTANT: Check section param FIRST before method matching

  // GET with section=memories → memories endpoint
  if (req.method === 'GET' && section === 'memories') {
    return handleGetMemories(req, corsHeaders);
  }

  // GET without section → message history
  if (req.method === 'GET') {
    return handleGetHistory(req, corsHeaders);
  }

  // DELETE → delete message
  if (req.method === 'DELETE') {
    return handleDeleteMessage(req, corsHeaders);
  }

  // PUT → update memory
  if (req.method === 'PUT') {
    return handleUpdateMemory(req, corsHeaders);
  }

  // POST → check body for memory operations, otherwise send message
  if (req.method === 'POST') {
    const clonedReq = req.clone();
    try {
      const body = await clonedReq.json();
      if (body.memoryId && (body.archive !== undefined || body.action === 'delete')) {
        return handleDeleteMemory(req, corsHeaders);
      }
    } catch {
      // Not JSON or no body, treat as message
    }
    return handlePostMessage(req, corsHeaders);
  }

  return json(corsHeaders, { error: 'Method not allowed' }, 405);
});