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
  const [isTyping, setIsTyping] = useState(false);

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
      setMessages(history.map((m: { id: string; role: string; content: string; created_at: string }) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
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
    setIsTyping(true);

    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        body: { message: content },
      });

      if (error) throw new Error(error.message);

      setIsTyping(false);

      const reply = data?.reply;
      if (typeof reply === 'string' && reply.trim()) {
        const assistantMessage: Message = {
          id: generateId(),
          role: 'assistant',
          content: reply,
          createdAt: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, assistantMessage]);
      } else {
        throw new Error('Empty response from Tipu');
      }
    } catch (err) {
      setIsTyping(false);
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: `Error: ${errorMessage}`,
        createdAt: new Date().toISOString(),
        error: true,
      };
      setMessages((prev) => [...prev, assistantMessage]);
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

  const handleDelete = useCallback(async (messageId: string) => {
    setMessages((prev) =>
      prev.map((m) =>
        m.id === messageId ? { ...m, deleting: true } : m
      )
    );

    try {
      const { error } = await supabase.functions.invoke('chat', {
        method: 'DELETE',
        body: { messageId },
      });

      if (error) throw new Error(error.message);

      setMessages((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to delete message:', err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, deleting: false } : m
        )
      );
    }
  }, []);

  const handleClearChat = useCallback(async () => {
    if (!confirm('Clear all messages? This cannot be undone.')) return;

    const deletePromises = messages.map((m) =>
      supabase.functions.invoke('chat', {
        method: 'DELETE',
        body: { messageId: m.id },
      })
    );

    await Promise.allSettled(deletePromises);
    setMessages([]);
  }, [messages]);

  useEffect(() => {
    const handleRetryEvent = (e: CustomEvent<string>) => {
      handleRetry(e.detail);
    };
    window.addEventListener('retry-message', handleRetryEvent as EventListener);
    return () => window.removeEventListener('retry-message', handleRetryEvent as EventListener);
  }, [handleRetry]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-warm-gradient">
        <header className="border-b border-border-light glass-warm sticky top-0 z-10">
          <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow">
                <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-medium text-text">Tipu</h1>
            </div>
          </div>
        </header>
        <main className="flex-1 max-w-3xl mx-auto w-full flex flex-col px-4 md:px-6 py-8">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-14 h-14 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-muted">Loading your memories...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-warm-gradient">
      <header className="border-b border-border-light glass-warm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-gold flex items-center justify-center shadow-glow animate-pulse-soft">
              <svg className="w-5 h-5 text-background" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-medium text-text">Tipu</h1>
              <p className="text-xs text-text-dim hidden md:block">Your personal AI companion</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="px-3 py-2 text-sm font-medium text-text-dim hover:text-error bg-background-card border border-border-light rounded-xl hover:border-error/30 transition-smooth"
                title="Clear chat"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              onClick={() => signOut()}
              className="px-4 py-2 text-sm font-medium text-text-muted hover:text-primary bg-background-card border border-border-light rounded-xl hover:border-primary/30 transition-smooth shadow-soft"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-3xl mx-auto w-full flex flex-col px-4 md:px-6 py-6 md:py-8">
        <MessageList
          messages={messages}
          isTyping={isTyping}
          onDelete={handleDelete}
        />
        <MessageInput
          onSend={sendMessage}
          disabled={sending}
          placeholder={isTyping ? 'Tipu is thinking...' : 'Message Tipu...'}
        />
      </main>
    </div>
  );
}