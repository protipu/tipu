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
    <div className="border-t px-4 py-3" style={{ borderColor: 'rgba(255,255,255,0.1)', background: '#212121' }}>
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="flex items-end rounded-xl px-4 py-3 gap-3" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.15)' }}>
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent text-white outline-none resize-none text-[15px] leading-relaxed disabled:opacity-40 placeholder:text-white/30"
              style={{ minHeight: '24px', maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!canSend}
              className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all ${canSend ? 'text-[#212121] hover:opacity-90 active:scale-95' : 'text-white/15 cursor-not-allowed'}`}
              style={canSend ? { background: '#C9A24B' } : { background: 'rgba(255,255,255,0.05)' }}
              aria-label="Send"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
              </svg>
            </button>
          </div>
        </form>
        <p className="text-center text-[11px] text-white/20 mt-2">Tipu can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}
