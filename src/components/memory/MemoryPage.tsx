import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import type { Memory, MemoryCategory } from '../../types/memory';
import { CATEGORY_META } from '../../types/memory';
import { MemoryCard } from './MemoryCard';

const ALL_CATEGORIES = Object.keys(CATEGORY_META) as MemoryCategory[];

type FilterTab = 'all' | MemoryCategory;

export function MemoryPage() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMemories();
  }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      setError(null);

      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(
        `${supabaseUrl}/functions/v1/chat?section=memories`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': anonKey,
          },
        }
      );

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      setMemories(result.memories || []);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load memories';
      setError(msg);
      console.error('Load memories error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (memoryId: string, updates: Partial<Memory>) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memoryId, ...updates }),
      });

      if (!response.ok) throw new Error('Failed to update memory');

      setMemories((prev) =>
        prev.map((m) => (m.id === memoryId ? { ...m, ...updates } : m))
      );
    } catch (err) {
      console.error('Update memory error:', err);
    }
  };

  const handleArchive = async (memoryId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memoryId, archive: true }),
      });

      if (!response.ok) throw new Error('Failed to archive memory');

      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch (err) {
      console.error('Archive memory error:', err);
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      const response = await fetch(`${supabaseUrl}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': anonKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memoryId, action: 'delete' }),
      });

      if (!response.ok) throw new Error('Failed to delete memory');

      setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    } catch (err) {
      console.error('Delete memory error:', err);
    }
  };

  const filtered = filter === 'all'
    ? memories
    : memories.filter((m) => m.category === filter);

  const categoryCounts = memories.reduce((acc, m) => {
    acc[m.category] = (acc[m.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex-1 flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-text">Memory</h2>
          <p className="text-xs text-text-dim mt-0.5">
            {memories.length} {memories.length === 1 ? 'memory' : 'memories'} stored
          </p>
        </div>
      </div>

      {/* Category filter pills */}
      <div className="bg-white border-b border-border px-4 py-2">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-smooth ${
              filter === 'all'
                ? 'bg-primary text-white'
                : 'bg-background text-text-dim hover:text-text border border-border'
            }`}
          >
            All ({memories.length})
          </button>
          {ALL_CATEGORIES.filter((cat) => (categoryCounts[cat] || 0) > 0).map((cat) => {
            const meta = CATEGORY_META[cat];
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-smooth flex items-center gap-1 ${
                  filter === cat
                    ? 'bg-primary text-white'
                    : 'bg-background text-text-dim hover:text-text border border-border'
                }`}
              >
                <span>{meta.icon}</span>
                {meta.label} ({categoryCounts[cat] || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Memory list */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm text-text-muted mt-3">Loading memories...</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-error/5 border border-error/20 rounded-xl p-4 text-center">
              <p className="text-sm text-error">{error}</p>
              <button
                onClick={loadMemories}
                className="mt-2 text-xs font-medium text-primary hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">
                {filter === 'all' ? 'No memories yet' : `No ${CATEGORY_META[filter].label.toLowerCase()} memories`}
              </h3>
              <p className="text-xs text-text-muted text-center max-w-[200px]">
                {filter === 'all'
                  ? 'Tipu learns about you as you chat. Start a conversation!'
                  : `Tipu hasn't learned any ${CATEGORY_META[filter].label.toLowerCase()} facts yet.`}
              </p>
            </div>
          )}

          {!loading && !error && filtered.map((memory) => (
            <MemoryCard
              key={memory.id}
              memory={memory}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onArchive={handleArchive}
            />
          ))}
        </div>
      </div>
    </div>
  );
}