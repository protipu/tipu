import { useState, useRef, useEffect, type KeyboardEvent, type FormEvent } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageInput({ onSend, disabled = false, placeholder = 'Message Tipu...' }: MessageInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <div className="px-4 pb-4 pt-2">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="relative">
          <div
            className="flex items-end rounded-2xl px-4 py-3"
            style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              onSubmit={handleSubmit}
              disabled={disabled}
              placeholder={placeholder}
              rows={1}
              className="flex-1 bg-transparent text-white outline-none resize-none text-[15px] disabled:opacity-40 placeholder:text-white/30 leading-relaxed"
              style={{ minHeight: '24px', maxHeight: '200px' }}
            />
            <button
              type="submit"
              disabled={!canSend}
              className={`ml-2 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                canSend
                  ? 'text-white hover:bg-white/10 active:scale-95'
                  : 'text-white/20 cursor-not-allowed'
              }`}
              aria-label="Send message"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
              </svg>
            </button>
          </div>
          <p className="text-center text-[11px] text-white/20 mt-2">
            Tipu is not always right. Check important info.
          </p>
        </form>
      </div>
    </div>
  );
}
