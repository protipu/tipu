import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import type { Message } from '../types/chat';

function generateId() {
  return crypto.randomUUID();
}

export function Chat() {
  const { signOut } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load conversation history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        method: 'GET',
      });

      if (error) throw new Error(error.message);

      const history = data?.messages || [];
      setMessages(history.map((m: any) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.created_at,
      })));
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = useCallback(async (content: string) => {
    if (sending) return;

    const userMessage: Message = {
      id: generateId(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setSending(true);

    const assistantMessage: Message = {
      id: generateId(),
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
      error: false,
      retrying: false,
    };

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { message: content },
      });

      if (error) throw new Error(error.message);

      const reply = data?.reply;
      if (typeof reply === 'string' && reply.trim()) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessage.id
              ? { ...m, content: reply, error: false }
              : m
          )
        );
      } else {
        throw new Error('Empty response from Tipu');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: `Error: ${errorMessage}`, error: true, retrying: false }
            : m
        )
      );
    } finally {
      setSending(false);
    }
  }, [sending]);

  const handleRetry = useCallback((messageId: string) => {
    const message = messages.find((m) => m.id === messageId);
    if (!message || message.role !== 'assistant' || !message.error) return;

    const userMessage = [...messages].reverse().find((m) => m.role === 'user' && new Date(m.createdAt) < new Date(message.createdAt));
    if (!userMessage) return;

    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, content: '', error: false, retrying: true } : m
      )
    );

    sendMessage(userMessage.content);
  }, [messages, sendMessage]);

  useEffect(() => {
    const handleRetryEvent = (e: CustomEvent<string>) => {
      handleRetry(e.detail);
    };
    window.addEventListener('retry-message', handleRetryEvent as EventListener);
    return () => window.removeEventListener('retry-message', handleRetryEvent as EventListener);
  }, [handleRetry]);

  // Show loading state while history loads
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <h1 className="text-xl font-medium text-text">Tipu</h1>
            <button
              onClick={() => signOut()}
              className="px-3 py-1.5 text-sm text-text-muted hover:text-text bg-background-muted rounded-md hover:bg-background border border-border transition-colors"
            >
              Sign out
            </button>
          </div>
        </header>
        <main className="flex-1 max-w-3xl mx-auto w-full flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-medium text-text">Tipu</h1>
          <button
            onClick={() => signOut()}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-text bg-background-muted rounded-md hover:bg-background border border-border transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full flex flex-col">
        <MessageList messages={messages} />
        <MessageInput
          onSend={sendMessage}
          disabled={sending}
          placeholder={sending ? 'Tipu is thinking...' : 'Message Tipu...'}
        />
      </main>
    </div>
  );
}