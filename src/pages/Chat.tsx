import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { MemoryPage } from '../components/memory/MemoryPage';
import { Settings } from './Settings';
import type { Message } from '../types/chat';

function generateId() {
  return crypto.randomUUID();
}

type Tab = 'chat' | 'memory' | 'settings';

const TAB_ICONS: Record<Tab, import('react').ReactElement> = {
  chat: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
      <path d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
  memory: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
};

export function Chat() {
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

  const PAGE_SIZE = 20;

  const loadHistory = async (offset = 0) => {
    try {
      const params = `offset=${offset}&limit=${PAGE_SIZE}`;
      const { data, error } = await supabase.functions.invoke(`chat?${params}`, {
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
      const is429 = errorMessage.includes('429') || errorMessage.includes('rate limit') || errorMessage.includes('busy');
      const assistantMessage: Message = {
        id: generateId(),
        role: 'assistant',
        content: is429
          ? 'Tipu is a bit busy right now. Give me a moment and try again!'
          : `Error: ${errorMessage}`,
        createdAt: new Date().toISOString(),
        error: !is429,
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
      <div className="min-h-screen flex flex-col" style={{ background: '#212121' }}>
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
            <p className="text-white/40 text-sm">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#212121' }}>
      {/* Header */}
      <header className="sticky top-0 z-10" style={{ background: '#212121', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {activeTab === 'chat' && (
              <>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium" style={{ background: '#C9A24B', color: '#212121' }}>
                  T
                </div>
                <span className="text-white font-medium text-[15px]">Tipu</span>
              </>
            )}
            {activeTab === 'memory' && (
              <span className="text-white font-medium text-[15px]">Memory</span>
            )}
            {activeTab === 'settings' && (
              <span className="text-white font-medium text-[15px]">Settings</span>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
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
              placeholder={isTyping ? 'Tipu is thinking...' : 'Message Tipu...'}
            />
          </div>
        )}

        {activeTab === 'memory' && <MemoryPage />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Bottom Navigation */}
      <nav className="sticky bottom-0 z-10" style={{ background: '#212121', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-3xl mx-auto flex">
          {(Object.keys(TAB_ICONS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex flex-col items-center gap-1 py-2 transition-colors ${
                activeTab === tab
                  ? 'text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {TAB_ICONS[tab]}
              <span className="text-[11px] capitalize">{tab}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
