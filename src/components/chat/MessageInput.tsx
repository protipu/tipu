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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  };

  const canSend = text.trim().length > 0 && !disabled;

  return (
    <form onSubmit={handleSubmit} className="p-3 px-4 border-t border-[rgba(201,162,75,0.16)] relative z-10" style={{ background: '#0A0D16' }}>
      <div className="flex items-center gap-2 bg-[#131829] border border-[rgba(201,162,75,0.16)] rounded-[22px] px-4 py-1.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onSubmit={handleSubmit}
          disabled={disabled}
          placeholder={placeholder}
          rows={1}
          className="flex-1 px-0 py-2 text-[#EDE9DE] bg-transparent border-none outline-none focus:ring-0 resize-none text-[14.5px] disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-[#5B6178]"
          style={{ minHeight: '36px', maxHeight: '120px', fontFamily: 'Inter, sans-serif' }}
        />        <button
          type="submit"
          disabled={!canSend}
          className={`w-[36px] h-[36px] rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
            canSend
              ? 'text-[#0A0D16] shadow-[0_4px_14px_rgba(201,162,75,0.25)] hover:shadow-[0_0_20px_rgba(201,162,75,0.3)] active:scale-90'
              : 'text-[#5B6178] cursor-not-allowed'
          }`}
          style={canSend ? { background: 'linear-gradient(160deg, #E8CE8C, #C9A24B)' } : undefined}
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M4 12L20 4L14 20L11 13L4 12Z" fill="currentColor"/>
          </svg>
        </button>
      </div>
    </form>
  );
}
