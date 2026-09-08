import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { MemoryPage } from '../components/memory/MemoryPage';
import type { Message } from '../types/chat';

function generateId() {
  return crypto.randomUUID();
}

type Tab = 'chat' | 'memory' | 'settings';

export function Chat() {
  const { signOut, user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('chat');
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async (offset = 0) => {
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        method: 'GET',
      });

      if (error) throw new Error(error.message);

      const history = data?.messages || [];
      setHasMore(data?.hasMore || false);

      const mapped = history.map((m: { id: string; role: string; content: string; created_at: string }) => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: m.created_at,
      })).reverse();

      if (offset === 0) {
        setMessages(mapped);
      } else {
        setMessages((prev) => [...mapped, ...prev]);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadOlder = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadHistory(messages.length);
  }, [loadingMore, hasMore, messages.length]);

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

      if (error) {
        console.error('Edge Function error:', error);
        throw new Error(error.message || error.toString());
      }

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

  useEffect(() => {
    const handleRetryEvent = (e: CustomEvent<string>) => {
      handleRetry(e.detail);
    };
    window.addEventListener('retry-message', handleRetryEvent as EventListener);
    return () => window.removeEventListener('retry-message', handleRetryEvent as EventListener);
  }, [handleRetry]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-app-gradient">
        <header className="bg-white border-b border-border sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">T</div>
            <h1 className="text-xl font-bold text-text">Tipu</h1>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col px-4 py-8">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-text-muted text-sm">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-app-gradient">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-lg font-bold">T</div>
            <div>
              <h1 className="text-lg font-bold text-text">Tipu</h1>
              <p className="text-xs text-text-dim">Your AI Companion</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className="p-2 text-text-dim hover:text-text rounded-lg hover:bg-background transition-smooth"
            title="Sign out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col">
        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col h-full">
            <MessageList
              messages={messages}
              isTyping={isTyping}
              onDelete={handleDelete}
              hasMore={hasMore}
              loadingMore={loadingMore}
              onLoadMore={loadOlder}
            />
            <MessageInput
              onSend={sendMessage}
              disabled={sending}
              placeholder={isTyping ? 'Tipu is thinking...' : 'Type a message...'}
            />
          </div>
        )}

        {activeTab === 'memory' && (
          <MemoryPage />
        )}

        {activeTab === 'settings' && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-background border border-border flex items-center justify-center">
                <svg className="w-8 h-8 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h2 className="text-lg font-semibold text-text mb-1">Settings</h2>
              <p className="text-sm text-text-muted mb-4">{user?.email}</p>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-sm font-medium text-error hover:text-white hover:bg-error rounded-xl border border-error/20 transition-smooth"
              >
                Sign out
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="bg-white border-t border-border sticky bottom-0 z-10">
        <div className="max-w-2xl mx-auto flex">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-smooth ${
              activeTab === 'chat' ? 'text-primary' : 'text-text-dim hover:text-text-muted'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span className="text-xs font-medium">Message</span>
          </button>
          <button
            onClick={() => setActiveTab('memory')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-smooth ${
              activeTab === 'memory' ? 'text-primary' : 'text-text-dim hover:text-text-muted'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span className="text-xs font-medium">Memory</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 flex flex-col items-center gap-1 py-3 transition-smooth ${
              activeTab === 'settings' ? 'text-primary' : 'text-text-dim hover:text-text-muted'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium">Settings</span>
          </button>
        </div>
      </nav>
    </div>
  );
}