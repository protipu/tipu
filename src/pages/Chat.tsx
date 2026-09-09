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
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M4 5h16v11H8l-4 4V5z" />
    </svg>
  ),
  memory: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M12 3a9 9 0 100 18 9 9 0 000-18z" />
      <path d="M12 7v5l3.5 2" strokeLinecap="round" />
    </svg>
  ),
  settings: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2M6 6l1.4 1.4M16.6 16.6L18 18M6 18l1.4-1.4M16.6 7.4L18 6" strokeLinecap="round" />
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
      <div className="min-h-screen flex flex-col" style={{ background: '#0A0D16' }}>
        <header className="border-b border-[rgba(201,162,75,0.16)] sticky top-0 z-10" style={{ background: '#0A0D16' }}>
          <div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-3">
            <div
              className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[18px] font-semibold text-[#0A0D16] flex-shrink-0"
              style={{
                background: 'radial-gradient(circle at 30% 25%, #E8CE8C, #C9A24B 60%, #8a6b28 100%)',
                fontFamily: 'var(--font-serif)',
                boxShadow: '0 0 0 1px rgba(201,162,75,0.35), 0 4px 14px rgba(201,162,75,0.18)',
              }}
            >T</div>
            <h1 className="text-[19px] text-[#EDE9DE]" style={{ fontFamily: 'var(--font-serif)' }}>Tipu</h1>
          </div>
        </header>
        <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col px-5 py-8">
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-10 h-10 border-2 border-[#C9A24B] border-t-transparent rounded-full animate-spin" />
              <p className="text-[#8891A8] text-sm">Loading...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0A0D16' }}>

      {/* Header — changes per tab */}
      <header className="border-b border-[rgba(201,162,75,0.16)] sticky top-0 z-10" style={{ background: '#0A0D16' }}>
        <div className="max-w-2xl mx-auto px-5 py-3 flex items-center gap-3">
          {activeTab === 'chat' && (
            <>
              <div
                className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[18px] font-semibold text-[#0A0D16] flex-shrink-0"
                style={{
                  background: 'radial-gradient(circle at 30% 25%, #E8CE8C, #C9A24B 60%, #8a6b28 100%)',
                  fontFamily: 'var(--font-serif)',
                  boxShadow: '0 0 0 1px rgba(201,162,75,0.35), 0 4px 14px rgba(201,162,75,0.18)',
                }}
              >T</div>
              <div className="flex-1 min-w-0">
                <div className="text-[19px] text-[#EDE9DE]" style={{ fontFamily: 'var(--font-serif)' }}>Tipu</div>
                <div className="text-[12px] text-[#8891A8] flex items-center gap-1.5">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#6FCF97] inline-block" style={{ boxShadow: '0 0 6px rgba(111,207,151,0.7)' }} />
                  Active
                </div>
              </div>
            </>
          )}
          {activeTab === 'memory' && (
            <div className="flex-1 min-w-0">
              <div className="text-[19px] text-[#EDE9DE]" style={{ fontFamily: 'var(--font-serif)' }}>Memory</div>
              <div className="text-[12px] text-[#8891A8]">What Tipu has learned about you</div>
            </div>
          )}
          {activeTab === 'settings' && (
            <div className="flex-1 min-w-0">
              <div className="text-[19px] text-[#EDE9DE]" style={{ fontFamily: 'var(--font-serif)' }}>Settings</div>
              <div className="text-[12px] text-[#8891A8]">Your account & preferences</div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-2xl mx-auto w-full flex flex-col relative z-10">
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
      <nav className="border-t border-[rgba(201,162,75,0.16)] sticky bottom-0 z-10" style={{ background: '#0A0D16' }}>
        <div className="max-w-2xl mx-auto flex">
          {(Object.keys(TAB_ICONS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 flex flex-col items-center gap-1 py-2.5 transition-colors ${
                activeTab === tab
                  ? 'text-[#E8CE8C]'
                  : 'text-[#5B6178] hover:text-[#8891A8]'
              }`}
            >
              {TAB_ICONS[tab]}
              <span className="text-[11px] font-medium capitalize">{tab}</span>
              <div className={`w-1 h-1 rounded-full mt-0.5 transition-colors ${activeTab === tab ? 'bg-[#E8CE8C]' : 'bg-transparent'}`} />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}
