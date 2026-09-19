import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder = 'Message Tipu...' }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { textareaRef.current?.focus(); }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = `${Math.min(ta.scrollHeight, 200)}px`; }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex items-end rounded-xl px-4 py-3 gap-3" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-strong)' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent outline-none resize-none text-[15px] leading-relaxed disabled:opacity-40"
              style={{ color: 'var(--text)', minHeight: '24px', maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!canSend}
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${canSend ? 'hover:opacity-90 active:scale-95' : 'cursor-not-allowed'}`}
              style={canSend ? { background: 'var(--gold)', color: 'var(--void)' } : { background: 'rgba(255,255,255,0.05)', color: 'var(--text-faint)' }}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-center text-[11px] mt-2" style={{ color: 'var(--text-faint)' }}>Tipu can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}
