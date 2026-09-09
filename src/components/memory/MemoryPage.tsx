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
  const [search, setSearch] = useState('');

  useEffect(() => { loadMemories(); }, []);

  const loadMemories = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error: e } = await supabase.functions.invoke('chat?section=memories', {
        method: 'GET',
      });
      if (e) throw new Error(e.message);
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

  const filtered = (filter === 'all' ? memories : memories.filter(m => m.category === filter))
    .filter(m => search === '' || m.fact.toLowerCase().includes(search.toLowerCase()));
  const counts = memories.reduce((a, m) => { a[m.category] = (a[m.category] || 0) + 1; return a; }, {} as Record<string, number>);

  return (
    <div className="flex-1 flex flex-col h-full relative z-10">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-2">
        <div className="max-w-lg mx-auto relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5B6178]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" strokeWidth="1.8"/>
            <path d="M20 20l-3.5-3.5" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search what Tipu remembers..."
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-[#131829] border border-[rgba(201,162,75,0.16)] rounded-2xl text-[#EDE9DE] placeholder:text-[#5B6178] focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 transition-colors"
          />
        </div>
      </div>

      {/* Intro text */}
      <div className="px-4 pb-3">
        <p className="max-w-lg mx-auto text-[13px] text-[#8891A8] leading-relaxed">
          Everything below is something you told Tipu directly. Nothing here was guessed — you can edit or remove any of it.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 pb-3">
        <div className="max-w-lg mx-auto flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              filter === 'all'
                ? 'text-[#0A0D16]'
                : 'text-[#5B6178] hover:text-[#EDE9DE] border border-[rgba(201,162,75,0.16)]'
            }`}
            style={filter === 'all' ? { background: 'linear-gradient(160deg, #E8CE8C, #C9A24B)', boxShadow: '0 0 20px rgba(201,162,75,0.2)' } : { background: 'rgba(255,255,255,0.03)' }}
          >
            All ({memories.length})
          </button>
          {ALL_CATEGORIES.filter(c => (counts[c] || 0) > 0).map(c => {
            const m = CATEGORY_META[c];
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  filter === c
                    ? 'text-[#0A0D16]'
                    : 'text-[#5B6178] hover:text-[#EDE9DE] border border-[rgba(201,162,75,0.16)]'
                }`}
                style={filter === c ? { background: 'linear-gradient(160deg, #E8CE8C, #C9A24B)', boxShadow: '0 0 20px rgba(201,162,75,0.2)' } : { background: 'rgba(255,255,255,0.03)' }}
              >
                <span>{m.icon}</span>{m.label} ({counts[c]})
              </button>
            );
          })}
        </div>
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto px-4 py-2">
        <div className="max-w-lg mx-auto space-y-2.5">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-10 h-10 border-2 border-[#C9A24B] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-[#8891A8] mt-3">Loading memories...</p>
            </div>
          )}
          {!loading && error && (
            <div className="border border-[#F87171]/20 rounded-2xl p-4 text-center" style={{ background: 'rgba(255,255,255,0.02)' }}>
              <p className="text-sm text-[#F87171]">{error}</p>
              <button onClick={loadMemories} className="mt-2 text-xs font-medium text-[#C9A24B] hover:text-[#E8CE8C] transition-colors">
                Try again
              </button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 rounded-2xl border border-[rgba(201,162,75,0.16)] flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <svg className="w-8 h-8 text-[#5B6178]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-[#EDE9DE] mb-1" style={{ fontFamily: 'var(--font-serif)' }}>
                {filter === 'all' ? 'No memories yet' : `No ${CATEGORY_META[filter].label.toLowerCase()} memories`}
              </h3>
              <p className="text-xs text-[#8891A8] text-center max-w-[200px]">
                Tipu learns about you as you chat.
              </p>
            </div>
          )}
          {!loading && !error && filtered.map((m, i) => (
            <div key={m.id} className="animate-slide-up" style={{ animationDelay: `${i * 0.04}s` }}>
              <MemoryCard memory={m} onUpdate={handleUpdate} onDelete={handleDelete} onArchive={handleArchive} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
