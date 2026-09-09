import { useRef, useEffect } from 'react';
import type { Message } from '../../types/chat';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onDelete?: (messageId: string) => void;
  hasMore?: boolean;
  loadingMore?: boolean;
  onLoadMore?: () => void;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start px-4 sm:px-0">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-1">
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: '#C9A24B', color: '#212121' }}>T</div>
        </div>
        <div className="flex items-center gap-1.5 py-3 px-4 rounded-2xl rounded-bl-md" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-16 sm:py-24">
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-6" style={{ background: '#C9A24B', color: '#212121' }}>T</div>
      <h2 className="text-2xl sm:text-3xl font-semibold text-white mb-2 text-center">Hi, I'm Tipu</h2>
      <p className="text-white/50 text-center text-[15px] max-w-sm leading-relaxed mb-8">
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
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
            <span className="text-xl">{s.icon}</span>
            <span className="text-sm text-white font-medium">{s.text}</span>
            <span className="text-[11px] text-white/30">{s.sub}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessageList({ messages, isTyping = false, onDelete, hasMore = false, loadingMore = false, onLoadMore }: MessageListProps) {
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto py-6 space-y-5">
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center py-2 px-4">
            <button onClick={onLoadMore} disabled={loadingMore}
              className="px-4 py-2 text-xs text-white/40 hover:text-white/60 rounded-lg transition-colors disabled:opacity-50"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && !isTyping && <WelcomeScreen />}

        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} onDelete={onDelete} />
        ))}

        {isTyping && messages.length > 0 && <TypingIndicator />}
        <div ref={endRef} />
      </div>
    </div>
  );
}
