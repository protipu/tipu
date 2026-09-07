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
      textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-6 border-t border-border-light bg-surface-gradient/50 backdrop-blur-xl">
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onSubmit={handleSubmit}
            disabled={disabled}
            placeholder={placeholder}
            rows={1}
            className="w-full px-5 py-4 text-text bg-background-card border border-border-light rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-smooth disabled:opacity-50 disabled:cursor-not-allowed resize-none placeholder:text-text-dim"
            style={{ minHeight: '56px', maxHeight: '160px' }}
          />
        </div>
        <button
          type="submit"
          disabled={disabled || !text.trim()}
          className="p-4 bg-gradient-to-br from-primary via-primary-hover to-primary-muted text-background rounded-2xl hover:from-primary-hover hover:via-primary-hover hover:to-primary focus:outline-none focus:ring-2 focus:ring-primary/40 focus:ring-offset-2 focus:ring-offset-background disabled:opacity-40 disabled:cursor-not-allowed transition-smooth flex-shrink-0 shadow-warm shadow-glow"
          aria-label="Send message"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </div>
    </form>
  );
}