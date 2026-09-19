import { useRef, useEffect } from 'react';
import type { Message } from '../../types/chat';
import { MessageBubble } from './MessageBubble';
import { TipuCharacter } from '../workspace/TipuCharacter';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  error?: string | null;
  onDelete?: (messageId: string) => void;
  onRetry?: (messageId: string) => void;
  onOpenFocus?: (content: string) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start px-4 sm:px-0">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          <TipuCharacter size="sm" mood="thinking" />
        </div>
        <div className="flex items-center gap-1.5 py-3 px-4 rounded-2xl rounded-bl-md" style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)' }}>
          <div className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--text-faint)' }} />
          <div className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--text-faint)' }} />
          <div className="typing-dot w-2 h-2 rounded-full" style={{ background: 'var(--text-faint)' }} />
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-16 sm:py-24">
      <TipuCharacter size="lg" mood="happy" className="mb-6" />
      <h2 className="text-2xl sm:text-3xl font-semibold mb-2 text-center" style={{ color: 'var(--text)', fontFamily: 'var(--font-serif)' }}>
        Hi, I'm Tipu
      </h2>
      <p className="text-center text-[15px] max-w-sm leading-relaxed mb-8" style={{ color: 'var(--text-muted)' }}>
        Your personal AI companion. Ask me anything — I remember what you share.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
        {[
          { icon: '💬', text: 'Hey Tipu!', sub: 'Start a conversation' },
          { icon: '😄', text: 'Tell me a joke', sub: 'Have some fun' },
          { icon: '🧠', text: 'What do you remember?', sub: 'Check my memory' },
        ].map((s) => (
          <button key={s.text}
            className="flex flex-col items-center gap-1 px-4 py-4 rounded-xl text-center transition-all hover:bg-white/5 active:scale-[0.98]"
            style={{ border: '1px solid var(--border)' }}>
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm font-medium" style={{ color: 'var(--text)' }}>{s.text}</span>
            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{s.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessageList({ messages, isTyping = false, onDelete, onOpenFocus, hasMore = false, loadingMore = false, onLoadMore }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto h-full">
      <div className="max-w-3xl mx-auto py-6 space-y-5">
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center py-2 px-4">
            <button onClick={onLoadMore} disabled={loadingMore}
              className="px-4 py-2 text-xs rounded-lg transition-colors disabled:opacity-50"
              style={{ color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && !isTyping && <WelcomeScreen />}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onDelete={onDelete} onOpenFocus={onOpenFocus} />
        ))}

        {isTyping && messages.length > 0 && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
