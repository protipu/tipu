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
    setSaving(false);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditFact(memory.fact);
    setEditImportance(memory.importance);
    setEditing(false);
  };

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -2;
    const rotateY = ((x - centerX) / centerX) * 2;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = '';
    }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'just now';
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="rounded-xl group transition-transform"
      style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.08)', transition: 'transform 0.1s ease-out' }}
    >
      <div className="p-3.5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={editFact}
                  onChange={(e) => setEditFact(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-[#212121] border border-white/10 rounded-xl focus:outline-none focus:border-white/20 resize-none text-white placeholder:text-white/30"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-white/40 font-medium">Importance:</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={editImportance}
                    onChange={(e) => setEditImportance(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#C9A24B]"
                  />
                  <span className="text-xs text-white/50 font-mono w-8 text-right">{editImportance}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !editFact.trim()}
                    className="px-3.5 py-1.5 text-xs font-medium text-[#212121] rounded-lg transition-colors disabled:opacity-50"
                    style={{ background: '#C9A24B' }}
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3.5 py-1.5 text-xs font-medium text-white/50 hover:text-white rounded-lg border border-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-[14px] text-white leading-relaxed">{memory.fact}</p>
            )}
          </div>

          {!editing && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-white/30 hover:text-white/60 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>

              {showActions && (
                <div className="absolute right-0 top-7 z-10 rounded-xl py-1 min-w-[120px]" style={{ background: '#212121', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 32px rgb(0 0 0 / 0.4)' }}>
                  <button
                    onClick={() => { setEditing(true); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => { onArchive(memory.id); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-white/70 hover:bg-white/5 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Archive
                  </button>
                  <button
                    onClick={() => { onDelete(memory.id); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-red-400 hover:bg-red-400/5 transition-colors flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {!editing && (
        <div className="px-3.5 pb-2.5 flex items-center justify-between text-[10px] text-white/30">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium" style={{ background: 'rgba(201,162,75,0.15)', color: '#E8CE8C' }}>
            {meta.icon} {meta.label}
          </span>
          <span>{timeAgo(memory.updated_at || memory.created_at)}</span>
        </div>
      )}
    </div>
  );
}
