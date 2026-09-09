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
    <div className="flex justify-start">
      <div className="flex gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
            style={{ background: '#C9A24B', color: '#212121' }}
          >
            T
          </div>
        </div>
        <div className="flex items-center gap-1.5 py-3">
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}

function FloatingWelcome() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 py-12">
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium mb-5"
        style={{ background: '#C9A24B', color: '#212121' }}
      >
        T
      </div>
      <h2 className="text-xl font-medium text-white mb-2">Hi, I'm Tipu</h2>
      <p className="text-white/50 text-center text-[15px] max-w-sm leading-relaxed">
        Your personal AI companion. Ask me anything — I remember what you share.
      </p>
      <div className="flex flex-wrap justify-center gap-2 mt-6 max-w-md">
        {['Hey Tipu!', 'Tell me a joke', 'What do you remember?'].map((suggestion) => (
          <button
            key={suggestion}
            className="px-4 py-2 text-[13px] text-white/60 rounded-full hover:bg-white/5 transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export function MessageList({ messages, isTyping = false, onDelete, hasMore = false, loadingMore = false, onLoadMore }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        {hasMore && messages.length > 0 && (
          <div className="flex justify-center py-2">
            <button
              onClick={onLoadMore}
              disabled={loadingMore}
              className="px-4 py-2 text-xs text-white/40 hover:text-white/60 rounded-full transition-colors disabled:opacity-50"
              style={{ border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {loadingMore ? 'Loading...' : 'Load older messages'}
            </button>
          </div>
        )}

        {messages.length === 0 && !isTyping && <FloatingWelcome />}

        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} onDelete={onDelete} />
        ))}

        {isTyping && messages.length > 0 && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
