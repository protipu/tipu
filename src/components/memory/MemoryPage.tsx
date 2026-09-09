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
  const [creating, setCreating] = useState(false);
  const [newFact, setNewFact] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryCategory>('personal');
  const [newImportance, setNewImportance] = useState(50);
  const [saving, setSaving] = useState(false);

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

  const handleCreate = async () => {
    if (!newFact.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', {
        method: 'POST',
        body: { fact: newFact.trim(), category: newCategory, importance: newImportance },
      });
      if (error) throw error;
      if (data?.memory) {
        setMemories(prev => [data.memory, ...prev]);
      }
      setCreating(false);
      setNewFact('');
      setNewCategory('personal');
      setNewImportance(50);
    } catch (err) {
      console.error('Create error:', err);
    } finally {
      setSaving(false);
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

      {/* FAB */}
      {!creating && (
        <button
          onClick={() => setCreating(true)}
          className="absolute bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center text-[#0A0D16] shadow-lg z-20 transition-transform hover:scale-110"
          style={{ background: 'linear-gradient(160deg, #E8CE8C, #C9A24B)', boxShadow: '0 4px 20px rgba(201,162,75,0.4)' }}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="absolute inset-0 z-30 flex items-end sm:items-center justify-center" onClick={() => setCreating(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 rounded-2xl border border-[rgba(201,162,75,0.16)] p-5"
            style={{ background: '#0D1117' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-semibold text-[#EDE9DE] mb-4" style={{ fontFamily: 'var(--font-serif)' }}>
              Add a memory
            </h3>

            <textarea
              value={newFact}
              onChange={(e) => setNewFact(e.target.value)}
              placeholder="What should Tipu remember?"
              className="w-full px-3 py-2.5 text-sm bg-[#131829] border border-[rgba(201,162,75,0.16)] rounded-xl text-[#EDE9DE] placeholder:text-[#5B6178] focus:outline-none focus:ring-2 focus:ring-[#C9A24B]/30 resize-none"
              rows={3}
              autoFocus
            />

            <div className="mt-3">
              <label className="text-xs text-[#5B6178] font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map(c => {
                  const m = CATEGORY_META[c];
                  return (
                    <button
                      key={c}
                      onClick={() => setNewCategory(c)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors flex items-center gap-1 ${
                        newCategory === c
                          ? 'text-[#0A0D16]'
                          : 'text-[#5B6178] border border-[rgba(201,162,75,0.16)]'
                      }`}
                      style={newCategory === c
                        ? { background: 'linear-gradient(160deg, #E8CE8C, #C9A24B)' }
                        : { background: 'rgba(255,255,255,0.03)' }}
                    >
                      {m.icon} {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-3">
              <label className="text-xs text-[#5B6178] font-medium mb-1.5 block">
                Importance: <span className="text-[#EDE9DE]">{newImportance}</span>
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={newImportance}
                onChange={(e) => setNewImportance(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C9A24B]"
              />
              <div className="flex justify-between text-[10px] text-[#5B6178] mt-0.5">
                <span>Low</span><span>Medium</span><span>High</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreate}
                disabled={saving || !newFact.trim()}
                className="flex-1 py-2.5 text-sm font-medium text-[#0A0D16] rounded-xl transition-colors disabled:opacity-50"
                style={{ background: 'linear-gradient(160deg, #E8CE8C, #C9A24B)' }}
              >
                {saving ? 'Saving...' : 'Save memory'}
              </button>
              <button
                onClick={() => { setCreating(false); setNewFact(''); }}
                className="px-4 py-2.5 text-sm font-medium text-[#5B6178] hover:text-[#EDE9DE] rounded-xl border border-[rgba(201,162,75,0.16)] transition-colors"
                style={{ background: 'rgba(255,255,255,0.03)' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
