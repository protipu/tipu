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
      setLoading(true); setError(null);
      const { data, error: e } = await supabase.functions.invoke('chat?section=memories', { method: 'GET' });
      if (e) throw new Error(e.message);
      setMemories(data?.memories || []);
    } catch (err) { setError(err instanceof Error ? err.message : 'Failed to load'); }
    finally { setLoading(false); }
  };

  const handleCreate = async () => {
    if (!newFact.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke('chat', { method: 'POST', body: { fact: newFact.trim(), category: newCategory, importance: newImportance } });
      if (error) throw error;
      if (data?.memory) setMemories(prev => [data.memory, ...prev]);
      setCreating(false); setNewFact(''); setNewCategory('personal'); setNewImportance(50);
    } catch (err) { console.error('Create error:', err); }
    finally { setSaving(false); }
  };

  const handleUpdate = async (memoryId: string, updates: Partial<Memory>) => {
    try {
      const { error } = await supabase.functions.invoke('chat', { method: 'PUT', body: { memoryId, ...updates } });
      if (error) throw error;
      setMemories(prev => prev.map(m => m.id === memoryId ? { ...m, ...updates } : m));
    } catch (err) { console.error('Update error:', err); }
  };

  const handleArchive = async (memoryId: string) => {
    try {
      const { error } = await supabase.functions.invoke('chat', { method: 'DELETE', body: { memoryId, archive: true } });
      if (error) throw error;
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch (err) { console.error('Archive error:', err); }
  };

  const handleDelete = async (memoryId: string) => {
    try {
      const { error } = await supabase.functions.invoke('chat', { method: 'DELETE', body: { memoryId } });
      if (error) throw error;
      setMemories(prev => prev.filter(m => m.id !== memoryId));
    } catch (err) { console.error('Delete error:', err); }
  };

  const filtered = (filter === 'all' ? memories : memories.filter(m => m.category === filter))
    .filter(m => search === '' || m.fact.toLowerCase().includes(search.toLowerCase()));
  const counts = memories.reduce((a, m) => { a[m.category] = (a[m.category] || 0) + 1; return a; }, {} as Record<string, number>);

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto w-full px-4 sm:px-6 py-6 space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-white">Memory</h2>
          <p className="text-sm text-white/40 mt-0.5">What Tipu has learned about you</p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl text-white placeholder:text-white/30 focus:outline-none transition-colors"
            style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.12)' }} />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
          <button onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            All ({memories.length})
          </button>
          {ALL_CATEGORIES.filter(c => (counts[c] || 0) > 0).map(c => {
            const m = CATEGORY_META[c];
            return (
              <button key={c} onClick={() => setFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${filter === c ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60 hover:bg-white/5'}`}
                style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                {m.icon} {m.label} ({counts[c]})
              </button>
            );
          })}
        </div>

        {/* Memory List */}
        <div className="space-y-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
              <p className="text-sm text-white/40 mt-3">Loading memories...</p>
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}>
              <p className="text-sm text-red-400">{error}</p>
              <button onClick={loadMemories} className="mt-2 text-xs text-[#C9A24B] hover:text-[#E8CE8C] transition-colors">Try again</button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl" style={{ border: '1px dashed rgba(255,255,255,0.1)' }}>
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-white mb-1">{filter === 'all' ? 'No memories yet' : `No ${CATEGORY_META[filter].label.toLowerCase()} memories`}</h3>
              <p className="text-xs text-white/40 text-center max-w-[200px]">Tipu learns about you as you chat.</p>
            </div>
          )}
          {!loading && !error && filtered.map((m) => (
            <MemoryCard key={m.id} memory={m} onUpdate={handleUpdate} onDelete={handleDelete} onArchive={handleArchive} />
          ))}
        </div>
      </div>

      {/* FAB */}
      {!creating && (
        <button onClick={() => setCreating(true)}
          className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 w-12 h-12 rounded-xl flex items-center justify-center text-[#212121] z-20 hover:scale-105 active:scale-95 transition-transform shadow-lg"
          style={{ background: '#C9A24B', boxShadow: '0 4px 20px rgba(201,162,75,0.3)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" onClick={() => setCreating(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div className="relative w-full max-w-lg mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"
            style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 16px 64px rgb(0 0 0 / 0.5)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-white mb-4">Add a memory</h3>
            <textarea value={newFact} onChange={(e) => setNewFact(e.target.value)}
              placeholder="What should Tipu remember?"
              className="w-full px-3 py-2.5 text-sm rounded-xl text-white placeholder:text-white/30 focus:outline-none resize-none"
              style={{ background: '#212121', border: '1px solid rgba(255,255,255,0.12)' }} rows={3} autoFocus />
            <div className="mt-3">
              <label className="text-xs text-white/40 font-medium mb-2 block">Category</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map(c => {
                  const m = CATEGORY_META[c];
                  return (
                    <button key={c} onClick={() => setNewCategory(c)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${newCategory === c ? 'text-white bg-white/10' : 'text-white/40 hover:text-white/60'}`}
                      style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
                      {m.icon} {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs text-white/40 font-medium mb-1.5 block">Importance: <span className="text-white">{newImportance}</span></label>
              <input type="range" min="1" max="100" value={newImportance} onChange={(e) => setNewImportance(parseInt(e.target.value))}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C9A24B]" />
              <div className="flex justify-between text-[10px] text-white/30 mt-0.5"><span>Low</span><span>Medium</span><span>High</span></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCreate} disabled={saving || !newFact.trim()}
                className="flex-1 py-2.5 text-sm font-medium text-[#212121] rounded-xl transition-colors disabled:opacity-50"
                style={{ background: '#C9A24B' }}>
                {saving ? 'Saving...' : 'Save memory'}
              </button>
              <button onClick={() => { setCreating(false); setNewFact(''); }}
                className="px-4 py-2.5 text-sm font-medium text-white/60 hover:text-white rounded-xl transition-colors"
                style={{ border: '1px solid rgba(255,255,255,0.12)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
