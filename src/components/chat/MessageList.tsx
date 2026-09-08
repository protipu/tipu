import { useRef, useEffect } from 'react';
import type { Message } from '../../types/chat';
import { MessageBubble } from './MessageBubble';

interface MessageListProps {
  messages: Message[];
  isTyping?: boolean;
  onDelete?: (messageId: string) => void;
}

function TypingIndicator() {
  return (
    <div className="flex justify-start animate-fade-in">
      <div className="bg-surface-gradient text-text rounded-2xl rounded-bl-lg border border-border-light shadow-soft px-4 py-3">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}

function SkeletonMessage({ isUser }: { isUser: boolean }) {
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-pulse`}>
      <div
        className={`max-w-[60%] px-4 py-3 rounded-2xl ${
          isUser
            ? 'bg-primary-muted/30 rounded-br-lg h-12'
            : 'bg-border-light/30 rounded-bl-lg h-16'
        }`}
      >
        <div className={`h-3 rounded-full ${isUser ? 'bg-primary-muted/40 w-24' : 'bg-border-light/50 w-32'}`}></div>
        {!isUser && (
          <div className="h-3 rounded-full bg-border-light/40 w-20 mt-2"></div>
        )}
      </div>
    </div>
  );
}

export function MessageList({ messages, isTyping = false, onDelete }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 scrollbar-thin">
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          <div className="w-20 h-20 mb-6 rounded-2xl bg-surface-gradient border border-border-light flex items-center justify-center shadow-soft animate-pulse-soft">
            <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h2 className="text-xl font-medium text-text mb-2">Welcome back</h2>
          <p className="text-text-muted text-center max-w-xs">
            Start a conversation with Tipu — your personal AI companion who remembers.
          </p>
        </div>
      )}

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