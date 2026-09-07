import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS, GET',
};

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;
const GROQ_MODEL = 'groq/compound';

serve(async (req: Request) => {
  console.log('=== Chat function invoked ===', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method === 'GET') {
    return handleGetHistory(req, corsHeaders);
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  return handlePostMessage(req, corsHeaders);
});

async function handleGetHistory(req: Request, corsHeaders: Record<string, string>) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: messages, error } = await supabase
      .from('messages')
      .select('id, role, content, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(20);

    if (error) throw error;

    return new Response(JSON.stringify({ messages: messages || [] }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Get history error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function handlePostMessage(req: Request, corsHeaders: Record<string, string>) {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { message } = body;
    console.log('Message:', message);

    if (!message?.trim()) {
      return new Response(JSON.stringify({ error: 'Message required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load recent conversation history (last 10 messages)
    const { data: history, error: historyError } = await supabase
      .from('messages')
      .select('role, content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(10);

    if (historyError) console.error('History load error:', historyError);

    // Load stored facts for this user (last 20 facts)
    const { data: facts, error: factsError } = await supabase
      .from('memory_facts')
      .select('fact, category')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (factsError) console.error('Facts load error:', factsError);

    // Build system prompt with facts
    const factsText = (facts || []).length > 0
      ? `\n\nKnown facts about the user:\n${(facts || []).map((f: any) => `- ${f.fact} (${f.category || 'general'})`).join('\n')}`
      : '';

    const systemPrompt = `You are Tipu, a personal AI companion. You are warm, friendly, and conversational — like a close friend who remembers things about the user's life. You don't use formal language, you don't lecture, and you don't act like a customer service bot. You're genuinely interested and you remember what the user tells you.${factsText}

Keep responses natural and concise. Don't over-explain. Use casual language.`;

    // Build messages for Groq: system + history + current user message
    const groqMessages = [
      { role: 'system', content: systemPrompt },
      { role: 'assistant', content: 'Got it. I am Tipu — warm, friendly, and I remember. How can I help?' },
      ...(history || []).map(m => ({ role: m.role, content: m.content })),
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
          model: GROQ_MODEL,
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

    // Save both messages to database
    const now = new Date().toISOString();
    const { error: saveError } = await supabase.from('messages').insert([
      { user_id: user.id, role: 'user', content: message, created_at: now },
      { user_id: user.id, role: 'assistant', content: reply, created_at: now },
    ]);

    if (saveError) console.error('Save messages error:', saveError);

    // Get the user message ID for fact extraction reference
    const { data: userMsg } = await supabase
      .from('messages')
      .select('id')
      .eq('user_id', user.id)
      .eq('role', 'user')
      .eq('content', message)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Fact extraction (async, non-blocking) - only if we have a user message ID
    if (userMsg?.id) {
      extractAndSaveFacts(supabase, user.id, userMsg.id, message, reply);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error';
    console.error('Function error:', msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
}

async function extractAndSaveFacts(
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
{"fact": "short factual statement", "category": "work|health|people|preference|event|general"}

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
          model: GROQ_MODEL,
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

    let factJson;
    try {
      factJson = JSON.parse(factText);
    } catch {
      console.error('Failed to parse fact JSON:', factText);
      return;
    }

    if (!factJson.fact) {
      console.log('No fact extracted');
      return;
    }

    // Save the fact
    const { error: factError } = await supabase
      .from('memory_facts')
      .insert({
        user_id: userId,
        fact: factJson.fact,
        category: factJson.category || 'general',
        source_message_id: sourceMessageId,
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