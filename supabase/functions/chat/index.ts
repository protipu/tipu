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
    'Access-Control-Allow-Methods': 'POST, OPTIONS, GET, DELETE',
  };
}

// ── Helpers ────────────────────────────────────────────────────────────────

function jsonResponse(corsHeaders: Record<string, string>, body: unknown, status = 200) {
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
    return { supabase: null, user: null, error: jsonResponse(corsHeaders, { error: 'Missing Authorization header' }, 401) };
  }

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return { supabase: null, user: null, error: jsonResponse(corsHeaders, { error: 'Unauthorized' }, 401) };
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

    return jsonResponse(corsHeaders, { messages: messages || [], hasMore: messages?.length === limit });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Get history error:', msg);
    return jsonResponse(corsHeaders, { error: msg }, 500);
  }
}

async function handleDeleteMessage(req: Request, corsHeaders: Record<string, string>) {
  try {
    const { supabase, user, error: authResp } = await authenticateUser(req, corsHeaders);
    if (authResp) return authResp;

    const body = await req.json();
    const { messageId } = body;

    if (!messageId) {
      return jsonResponse(corsHeaders, { error: 'messageId required' }, 400);
    }

    const { error } = await supabase!
      .from('messages')
      .delete()
      .eq('id', messageId)
      .eq('user_id', user!.id);

    if (error) throw error;

    return jsonResponse(corsHeaders, { success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Delete message error:', msg);
    return jsonResponse(corsHeaders, { error: msg }, 500);
  }
}

async function handlePostMessage(req: Request, corsHeaders: Record<string, string>) {
  try {
    const { supabase, user, error: authResp } = await authenticateUser(req, corsHeaders);
    if (authResp) return authResp;

    const body = await req.json();
    const { message } = body;

    if (!message?.trim()) {
      return jsonResponse(corsHeaders, { error: 'Message required' }, 400);
    }

    if (message.length > MAX_MESSAGE_LENGTH) {
      return jsonResponse(corsHeaders, { error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` }, 400);
    }

    // Load last 5 messages for AI context (SHORT-TERM MEMORY)
    const { data: history, error: historyError } = await supabase!
      .from('messages')
      .select('role, content')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(AI_CONTEXT_LIMIT);

    if (historyError) console.error('History load error:', historyError);

    // Load relevant memories (LONG-TERM MEMORY)
    const { data: facts, error: factsError } = await supabase!
      .from('memory_facts')
      .select('fact, category')
      .eq('user_id', user!.id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(20);

    if (factsError) console.error('Facts load error:', factsError);

    const factsText = (facts || []).length > 0
      ? `\n\nKnown facts about the user:\n${(facts || []).map((f: { fact: string; category: string | null }) => `- ${f.fact} (${f.category || 'general'})`).join('\n')}`
      : '';

    const systemPrompt = `You are Tipu, a personal AI companion. You are warm, friendly, and conversational — like a close friend who remembers things about the user's life. You don't use formal language, you don't lecture, and you don't act like a customer service bot. You're genuinely interested and you remember what the user tells you.${factsText}

Keep responses natural and concise. Don't over-explain. Use casual language.`;

    // Build messages: system + reversed history (oldest first) + current message
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

    // Save messages with distinct timestamps for deterministic ordering
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

    // Use the actual inserted user message ID for fact extraction
    const userMsgId = insertedMessages?.find((m: { id: string; role: string }) => m.role === 'user')?.id;

    if (userMsgId) {
      extractAndSaveFacts(supabase!, user!.id, userMsgId, message, reply);
    }

    return jsonResponse(corsHeaders, { reply });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Function error:', msg);
    return jsonResponse(corsHeaders, { error: msg }, 500);
  }
}

// ── Fact Extraction ────────────────────────────────────────────────────────

async function extractAndSaveFacts(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  sourceMessageId: string,
  userMessage: string,
  assistantReply: string
) {
  try {
    console.log('Extracting facts from exchange...');

    const factPrompt = `Given this conversation exchange, extract ONE durable fact about the user that would be useful to remember long-term.

User: ${userMessage}
Assistant: ${assistantReply}

If there's a clear fact about the user's life (preferences, habits, events, relationships, work, health, etc.), return it as a JSON object:
{"fact": "short factual statement", "category": "personal|preference|work|people|relationship|goal|project|event|habit|general"}

If no durable fact exists, return: {"fact": null}`;

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
            { role: 'system', content: 'You extract durable facts from conversations. Return only valid JSON.' },
            { role: 'user', content: factPrompt },
          ],
          max_tokens: 200,
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

    // Strip markdown fences before parsing
    const cleanJson = stripMarkdownFences(factText);

    let factJson: { fact: string | null; category?: string };
    try {
      factJson = JSON.parse(cleanJson);
    } catch {
      console.error('Failed to parse fact JSON:', cleanJson);
      return;
    }

    if (!factJson.fact) {
      console.log('No fact extracted');
      return;
    }

    const { error: factError } = await supabase
      .from('memory_facts')
      .insert({
        user_id: userId,
        fact: factJson.fact,
        category: factJson.category || 'general',
        source_message_id: sourceMessageId,
        status: 'active',
      });

    if (factError) {
      console.error('Save fact error:', factError);
    } else {
      console.log('Fact saved:', factJson.fact, '| category:', factJson.category);
    }
  } catch (err) {
    console.error('Fact extraction error:', err);
  }
}

// ── Main ───────────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  const origin = req.headers.get('Origin');
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (!configOk) {
    return jsonResponse(corsHeaders, { error: 'Server configuration error' }, 500);
  }

  if (req.method === 'GET') {
    return handleGetHistory(req, corsHeaders);
  }

  if (req.method === 'DELETE') {
    return handleDeleteMessage(req, corsHeaders);
  }

  if (req.method !== 'POST') {
    return jsonResponse(corsHeaders, { error: 'Method not allowed' }, 405);
  }

  return handlePostMessage(req, corsHeaders);
});