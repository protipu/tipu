import { useState, useRef, type MouseEvent } from 'react';
import type { Memory } from '../../types/memory';
import { getCategoryMeta } from '../../types/memory';

interface MemoryCardProps {
  memory: Memory;
  onUpdate: (memoryId: string, updates: Partial<Memory>) => Promise<void>;
  onDelete: (memoryId: string) => Promise<void>;
  onArchive: (memoryId: string) => Promise<void>;
}

export function MemoryCard({ memory, onUpdate, onDelete, onArchive }: MemoryCardProps) {
  const [editing, setEditing] = useState(false);
  const [editFact, setEditFact] = useState(memory.fact);
  const [editImportance, setEditImportance] = useState(memory.importance);
  const [saving, setSaving] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const meta = getCategoryMeta(memory.category);

  const handleSave = async () => {
    if (!editFact.trim()) return;
    setSaving(true);
    await onUpdate(memory.id, { fact: editFact.trim(), importance: editImportance });
    setSaving(false); setEditing(false);
  };

  const handleCancel = () => { setEditFact(memory.fact); setEditImportance(memory.importance); setEditing(false); };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current; if (!card) return;
    const rect = card.getBoundingClientRect();
    const rotateX = ((e.clientY - rect.top - rect.height / 2) / (rect.height / 2)) * -2;
    const rotateY = ((e.clientX - rect.left - rect.width / 2) / (rect.width / 2)) * 2;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const h = Math.floor(diff / 3600000); const d = Math.floor(h / 24);
    return d > 0 ? `${d}d ago` : h > 0 ? `${h}h ago` : 'just now';
  };

  return (
    <div ref={cardRef} onMouseMove={handleMouseMove} onMouseLeave={() => { if (cardRef.current) cardRef.current.style.transform = ''; }}
      className="rounded-xl group transition-transform"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)', transition: 'transform 0.1s ease-out' }}>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <textarea value={editFact} onChange={(e) => setEditFact(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl focus:outline-none resize-none"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', color: 'var(--text)' }} rows={3} autoFocus />
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Importance:</label>
                  <input type="range" min="1" max="100" value={editImportance} onChange={(e) => setEditImportance(parseInt(e.target.value))}
                    className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: 'rgba(255,255,255,0.1)', accentColor: 'var(--gold)' }} />
                  <span className="text-xs font-mono w-8 text-right" style={{ color: 'var(--text-muted)' }}>{editImportance}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleSave} disabled={saving || !editFact.trim()}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                    style={{ background: 'var(--gold)', color: 'var(--void)' }}>{saving ? 'Saving...' : 'Save'}</button>
                  <button onClick={handleCancel}
                    className="px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors"
                    style={{ color: 'var(--text-muted)', border: '1px solid var(--border-strong)' }}>Cancel</button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] leading-relaxed" style={{ color: 'var(--text)' }}>{memory.fact}</p>
            )}
          </div>
          {!editing && (
            <div className="relative">
              <button onClick={() => setShowActions(!showActions)}
                className="p-1.5 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                style={{ color: 'var(--text-faint)' }}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>
              {showActions && (
                <div className="absolute right-0 top-9 z-10 rounded-xl py-1 min-w-[130px]"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border-strong)', boxShadow: '0 8px 32px rgb(0 0 0 / 0.5)' }}>
                  <button onClick={() => { setEditing(true); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2"
                    style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                    Edit
                  </button>
                  <button onClick={() => { onArchive(memory.id); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2"
                    style={{ color: 'var(--text-muted)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" /></svg>
                    Archive
                  </button>
                  <div className="mx-2 my-1" style={{ borderTop: '1px solid var(--border)' }} />
                  <button onClick={() => { onDelete(memory.id); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs transition-colors flex items-center gap-2"
                    style={{ color: 'var(--danger)' }}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {!editing && (
        <div className="px-4 pb-3 flex items-center justify-between text-[10px]" style={{ color: 'var(--text-faint)' }}>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium" style={{ background: 'var(--gold-dim)', color: 'var(--gold-soft)' }}>
            {meta.icon} {meta.label}
          </span>
          <span>{timeAgo(memory.updated_at || memory.created_at)}</span>
        </div>
      )}
    </div>
  );
}
