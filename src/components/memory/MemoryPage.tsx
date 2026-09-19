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
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>Memory</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>What Tipu has learned about you</p>
        </div>

        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="7" strokeWidth="1.8"/><path d="M20 20l-3.5-3.5" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search memories..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl focus:outline-none transition-colors"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', color: 'var(--text)' }} />
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
          <button onClick={() => setFilter('all')}
            className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              color: filter === 'all' ? 'var(--text)' : 'var(--text-faint)',
              background: filter === 'all' ? 'rgba(255,255,255,0.08)' : 'transparent',
              border: '1px solid var(--border)',
            }}>
            All ({memories.length})
          </button>
          {ALL_CATEGORIES.filter(c => (counts[c] || 0) > 0).map(c => {
            const m = CATEGORY_META[c];
            return (
              <button key={c} onClick={() => setFilter(c)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5"
                style={{
                  color: filter === c ? 'var(--text)' : 'var(--text-faint)',
                  background: filter === c ? 'rgba(255,255,255,0.08)' : 'transparent',
                  border: '1px solid var(--border)',
                }}>
                {m.icon} {m.label} ({counts[c]})
              </button>
            );
          })}
        </div>

        {/* Memory List */}
        <div className="space-y-2">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--gold)' }} />
              <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>Loading memories...</p>
            </div>
          )}
          {!loading && error && (
            <div className="rounded-xl p-4 text-center" style={{ background: 'rgba(212,106,106,0.08)', border: '1px solid rgba(212,106,106,0.2)' }}>
              <p className="text-sm" style={{ color: 'var(--danger)' }}>{error}</p>
              <button onClick={loadMemories} className="mt-2 text-xs transition-colors" style={{ color: 'var(--gold)' }}>Try again</button>
            </div>
          )}
          {!loading && !error && filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 rounded-xl" style={{ border: '1px dashed var(--border-strong)' }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
                <svg className="w-6 h-6" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                </svg>
              </div>
              <h3 className="text-sm font-medium mb-1" style={{ color: 'var(--text)' }}>{filter === 'all' ? 'No memories yet' : `No ${CATEGORY_META[filter].label.toLowerCase()} memories`}</h3>
              <p className="text-xs text-center max-w-[200px]" style={{ color: 'var(--text-faint)' }}>Tipu learns about you as you chat.</p>
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
          className="fixed bottom-24 sm:bottom-8 right-4 sm:right-8 w-12 h-12 rounded-xl flex items-center justify-center z-20 hover:scale-105 active:scale-95 transition-transform shadow-lg"
          style={{ background: 'var(--gold)', color: 'var(--void)', boxShadow: '0 4px 20px rgba(201,162,75,0.3)' }}>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>
        </button>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="fixed inset-0 z-30 flex items-end sm:items-center justify-center" onClick={() => setCreating(false)}>
          <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div className="relative w-full max-w-lg mx-4 mb-0 sm:mb-0 rounded-t-2xl sm:rounded-2xl p-5 sm:p-6"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', boxShadow: '0 16px 64px rgb(0 0 0 / 0.5)' }}
            onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold mb-4" style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>Add a memory</h3>
            <textarea value={newFact} onChange={(e) => setNewFact(e.target.value)}
              placeholder="What should Tipu remember?"
              className="w-full px-3 py-2.5 text-sm rounded-xl focus:outline-none resize-none"
              style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)' }} rows={3} autoFocus />
            <div className="mt-3">
              <label className="text-xs font-medium mb-2 block" style={{ color: 'var(--text-muted)' }}>Category</label>
              <div className="flex flex-wrap gap-1.5">
                {ALL_CATEGORIES.map(c => {
                  const m = CATEGORY_META[c];
                  return (
                    <button key={c} onClick={() => setNewCategory(c)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors"
                      style={{
                        color: newCategory === c ? 'var(--text)' : 'var(--text-faint)',
                        background: newCategory === c ? 'rgba(255,255,255,0.08)' : 'transparent',
                        border: '1px solid var(--border)',
                      }}>
                      {m.icon} {m.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="mt-3">
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-muted)' }}>Importance: <span style={{ color: 'var(--text)' }}>{newImportance}</span></label>
              <input type="range" min="1" max="100" value={newImportance} onChange={(e) => setNewImportance(parseInt(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.1)', accentColor: 'var(--gold)' }} />
              <div className="flex justify-between text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}><span>Low</span><span>Medium</span><span>High</span></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={handleCreate} disabled={saving || !newFact.trim()}
                className="flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors disabled:opacity-50"
                style={{ background: 'var(--gold)', color: 'var(--void)' }}>
                {saving ? 'Saving...' : 'Save memory'}
              </button>
              <button onClick={() => { setCreating(false); setNewFact(''); }}
                className="px-4 py-2.5 text-sm font-medium rounded-xl transition-colors"
                style={{ color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
