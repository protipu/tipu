import type { ReactNode } from 'react';
import { TipuCharacter } from './TipuCharacter';

interface FocusViewProps {
  content: string;
  onClose: () => void;
  renderMarkdown: (content: string) => ReactNode;
}

export function FocusView({ content, onClose, renderMarkdown }: FocusViewProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-fade-in" style={{ background: 'var(--void)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <TipuCharacter size="sm" mood="happy" />
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>Tipu</h2>
            <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Full response</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-muted)' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
          <div className="markdown-content text-[14px] leading-relaxed" style={{ color: 'var(--text)' }}>
            {renderMarkdown(content)}
          </div>
        </div>
      </div>
    </div>
  );
}
