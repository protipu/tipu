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

  useEffect(() => { loadMemories(); }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase.functions.invoke('chat', {
        method: 'GET',
      });
      if (e) throw new Error(e.message);
      // The function uses query params, need to handle differently
      // Actually supabase.functions.invoke doesn't support query params well
      // Use the section param via URL
      setMemories(data?.memories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (memoryId: string, updates: Partial<Memory>) => {
    try {
      const { error } = await supabase.functions.invoke('chat', {
        method: 'PUT',
        body: { memoryId, ...updates },
      });
      if (error) throw error;
      setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, ...updates } : m));
    } catch (err) {
      console.error('Update error:', err);
    }
  };

  const handleArchive = async (memoryId: string) => {
    try {
      const { error } = await supabase.functions.invoke('chat', {
        method: 'DELETE',
        body: { memoryId, archive: true },
      });
      if (error) throw error;
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch (err) {
      console.error('Archive error:', err);
    }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      const { error } = await supabase.functions.invoke('chat', {
        method: 'DELETE',
        body: { memoryId },
      });
      if (error) throw error;
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filtered = filter === 'all' ? memories : memories.filter(m => m.category === filter);
  const counts = memories.reduce((a, m) => { a[m.category] = (a[m.category] || 0) + 1; return a; }, {} as Record<string, number>);

  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="bg-white border-b border-border px-4 py-3">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-lg font-bold text-text">Memory</h2>
          <p className="text-xs text-text-dim mt-0.5">{memories.length} {memories.length === 1 ? 'memory' : 'memories'} stored</p>
        </div>
      </div>

      <div className="bg-white border-b border-border px-4 py-2">
        <div className="max-w-2xl mx-auto flex gap-2 overflow-x-auto scrollbar-thin pb-1">
          <button onClick={() => setFilter('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-smooth ${filter === 'all' ? 'bg-primary text-white' : 'bg-background text-text-dim hover:text-text border border-border'}`}>
            All ({memories.length})
          </button>
          {ALL_CATEGORIES.filter(c => (counts[c] || 0) > 0).map(c => {
            const m = CATEGORY_META[c];
            return (
              <button key={c} onClick={() => setFilter(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-smooth flex items-center gap-1 ${filter === c ? 'bg-primary text-white' : 'bg-background text-text-dim hover:text-text border border-border'}`}>
                <span>{m.icon}</span>{m.label} ({counts[c]})
              </button>
            );
          })}
        </div>
      </div>

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
              <button onClick={loadMemories} className="mt-2 text-xs font-medium text-primary hover:underline">Try again</button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-background border border-border flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-text-dim" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-text mb-1">{filter === 'all' ? 'No memories yet' : `No ${CATEGORY_META[filter].label.toLowerCase()} memories`}</h3>
              <p className="text-xs text-text-muted text-center max-w-[200px]">Tipu learns about you as you chat.</p>
            </div>
          )}
          {!loading && !error && filtered.map(m => (
            <MemoryCard key={m.id} memory={m} onUpdate={handleUpdate} onDelete={handleDelete} onArchive={handleArchive} />
          ))}
        </div>
      </div>
    </div>
  );
}