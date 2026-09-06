import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY')!;
const GROQ_MODEL = 'groq/compound';

serve(async (req: Request) => {
  console.log('=== Chat function invoked ===');
  console.log('Method:', req.method);

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    console.log('Env vars loaded OK');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    console.log('Auth header present:', !!authHeader);
    
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    console.log('Auth result:', { user: !!user, authError: authError?.message });

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

    const systemPrompt = `You are Tipu, a personal AI companion. You are warm, friendly, and conversational — like a close friend who remembers things about the user's life. You don't use formal language, you don't lecture, and you don't act like a customer service bot. You're genuinely interested and you remember what the user tells you.

Keep responses natural and concise. Don't over-explain. Use casual language.`;

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
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'assistant', content: 'Got it. I am Tipu — warm, friendly, and I remember. How can I help?' },
            { role: 'user', content: message },
          ],
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
});