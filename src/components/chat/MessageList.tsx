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
    <div className="flex justify-start animate-fade-in">
      <div className="glass-light text-text rounded-2xl rounded-tl-md border border-border px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-primary rounded-full animate-wave" style={{ animationDelay: '0ms' }} />
          <div className="w-2 h-2 bg-primary/70 rounded-full animate-wave" style={{ animationDelay: '200ms' }} />
          <div className="w-2 h-2 bg-primary/40 rounded-full animate-wave" style={{ animationDelay: '400ms' }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonMessage({ isUser }: { isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-pulse`}>
      <div
        className={`max-w-[60%] px-4 py-3 rounded-2xl shimmer-bg ${
          isUser
            ? 'bg-primary/10 border border-primary/10 rounded-tr-md h-12'
            : 'glass-light border border-border rounded-tl-md h-16'
        }`}
      >
        <div className={`h-3 rounded-full ${isUser ? 'bg-primary/20 w-24' : 'bg-text-dim/20 w-32'}`} />
        {!isUser && (
          <div className="h-3 rounded-full bg-text-dim/10 w-20 mt-2" />
        )}
      </div>
    </div>
  );
}

function FloatingWelcome() {
  return (
    <div className="flex flex-col items-center justify-center h-full px-4 animate-scale-in">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-primary-gradient text-white flex items-center justify-center text-4xl font-bold shadow-glow animate-glow-pulse">
          T
        </div>
        <div className="absolute -inset-4 rounded-full border border-primary/10 animate-pulse-soft" />
        <div className="absolute -inset-8 rounded-full border border-primary/5 animate-pulse-soft" style={{ animationDelay: '0.5s' }} />
      </div>
      <h2 className="text-xl font-bold text-gradient mb-1">Hi, I'm Tipu!</h2>
      <p className="text-text-muted text-center text-sm max-w-xs leading-relaxed">
        Your personal AI companion. Ask me anything — I remember what you share.
      </p>
      <div className="flex gap-2 mt-4">
        {['Hey Tipu!', 'Tell me a joke', 'What do you remember?'].map((suggestion) => (
          <span key={suggestion} className="px-3 py-1 text-[10px] font-medium text-primary/60 glass-light rounded-full border border-primary/10">
            {suggestion}
          </span>
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin relative z-10">
      {hasMore && messages.length > 0 && (
        <div className="flex justify-center py-2 animate-fade-in">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="px-4 py-2 text-xs font-medium text-text-muted hover:text-primary glass-light border border-border rounded-full hover:border-primary/30 transition-smooth disabled:opacity-50"
          >
            {loadingMore ? (
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                Loading...
              </span>
            ) : (
              'Load older messages'
            )}
          </button>
        </div>
      )}

      {messages.length === 0 && !isTyping && <FloatingWelcome />}

      {messages.length === 0 && isTyping && (
        <div className="space-y-4">
          <SkeletonMessage isUser={true} />
          <SkeletonMessage isUser={false} />
        </div>
      )}

      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} onDelete={onDelete} />
      ))}

      {isTyping && messages.length > 0 && <TypingIndicator />}

      <div ref={messagesEndRef} />
    </div>
  );
}
