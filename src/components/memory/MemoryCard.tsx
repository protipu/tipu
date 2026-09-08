import { useState } from 'react';
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

  const importanceColor = memory.importance >= 80
    ? 'text-rose-600'
    : memory.importance >= 50
    ? 'text-amber-600'
    : 'text-text-dim';

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return 'just now';
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm hover:shadow-md transition-smooth group">
      {/* Main content */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Category badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${meta.color}`}>
                <span>{meta.icon}</span>
                {meta.label}
              </span>
              <span className={`text-xs font-semibold ${importanceColor}`}>
                {memory.importance >= 80 ? 'High' : memory.importance >= 50 ? 'Medium' : 'Low'} importance
              </span>
            </div>

            {/* Fact text */}
            {editing ? (
              <div className="space-y-3">
                <textarea
                  value={editFact}
                  onChange={(e) => setEditFact(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <label className="text-xs text-text-dim font-medium">Importance:</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={editImportance}
                    onChange={(e) => setEditImportance(parseInt(e.target.value))}
                    className="flex-1 h-1.5 bg-border rounded-full appearance-none cursor-pointer accent-primary"
                  />
                  <span className="text-xs text-text-muted font-mono w-8 text-right">{editImportance}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !editFact.trim()}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-primary rounded-lg hover:bg-primary-hover transition-smooth disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="px-3 py-1.5 text-xs font-medium text-text-dim hover:text-text bg-background rounded-lg border border-border transition-smooth"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-text leading-relaxed">{memory.fact}</p>
            )}
          </div>

          {/* Actions menu */}
          {!editing && (
            <div className="relative">
              <button
                onClick={() => setShowActions(!showActions)}
                className="p-1 text-text-dim hover:text-text rounded-lg hover:bg-background transition-smooth opacity-0 group-hover:opacity-100"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01" />
                </svg>
              </button>

              {showActions && (
                <div className="absolute right-0 top-8 z-10 bg-white border border-border rounded-xl shadow-lg py-1 min-w-[120px] animate-fade-in">
                  <button
                    onClick={() => { setEditing(true); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-text hover:bg-background transition-smooth flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => { onArchive(memory.id); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-text hover:bg-background transition-smooth flex items-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    Archive
                  </button>
                  <button
                    onClick={() => { onDelete(memory.id); setShowActions(false); }}
                    className="w-full px-3 py-2 text-left text-xs text-error hover:bg-error/5 transition-smooth flex items-center gap-2"
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

      {/* Footer */}
      {!editing && (
        <div className="px-4 pb-3 flex items-center justify-between text-[10px] text-text-dim">
          <span>Confidence: {memory.confidence}%</span>
          <span>{timeAgo(memory.updated_at || memory.created_at)}</span>
        </div>
      )}
    </div>
  );
}