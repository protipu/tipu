import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Message } from '../types/chat';

export function useChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const offsetRef = useRef(0);
  const LIMIT = 20;

  useEffect(() => { loadInitial(); }, []);

  const loadInitial = async () => {
    try {
      const { data, error: e } = await supabase.functions.invoke(`chat?offset=0&limit=${LIMIT}`, { method: 'GET' });
      if (e) throw new Error(e.message);
      const msgs = (data?.messages || []).reverse() as Array<{ id: string; role: string; content: string; created_at: string }>;
      setMessages(msgs.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content, createdAt: m.created_at })));
      setHasMore(data?.hasMore || false);
      offsetRef.current = msgs.length;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    }
  };

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const { data, error: e } = await supabase.functions.invoke(`chat?offset=${offsetRef.current}&limit=${LIMIT}`, { method: 'GET' });
      if (e) throw new Error(e.message);
      const older = (data?.messages || []).reverse() as Array<{ id: string; role: string; content: string; created_at: string }>;
      const mapped = older.map(m => ({ id: m.id, role: m.role as 'user' | 'assistant', content: m.content, createdAt: m.created_at }));
      setMessages(prev => [...mapped, ...prev]);
      setHasMore(data?.hasMore || false);
      offsetRef.current += older.length;
    } catch (err) {
      console.error('Load more error:', err);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore]);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;
    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);
    setError(null);

    try {
      const { data, error: e } = await supabase.functions.invoke('chat', {
        method: 'POST',
        body: { message: content },
      });
      if (e) throw new Error(e.message);
      if (data?.error) throw new Error(data.error);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.reply || 'No reply',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send');
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong',
        createdAt: new Date().toISOString(),
        error: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const retryMessage = useCallback(async (originalContent: string) => {
    setIsTyping(true);
    setError(null);
    setMessages(prev => prev.filter(m => m.error));

    try {
      const { data, error: e } = await supabase.functions.invoke('chat', {
        method: 'POST',
        body: { message: originalContent },
      });
      if (e) throw new Error(e.message);
      if (data?.error) throw new Error(data.error);

      const assistantMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data?.reply || 'No reply',
        createdAt: new Date().toISOString(),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to retry');
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: err instanceof Error ? err.message : 'Something went wrong',
        createdAt: new Date().toISOString(),
        error: true,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  }, []);

  const deleteMessage = useCallback(async (messageId: string) => {
    setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleting: true } : m));
    try {
      const { error: e } = await supabase.functions.invoke('chat', {
        method: 'DELETE',
        body: { messageId },
      });
      if (e) throw new Error(e.message);
      setMessages(prev => prev.filter(m => m.id !== messageId));
    } catch (err) {
      console.error('Delete error:', err);
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, deleting: false } : m));
    }
  }, []);

  return { messages, isTyping, error, hasMore, loadingMore, sendMessage, retryMessage, deleteMessage, loadMore };
}
