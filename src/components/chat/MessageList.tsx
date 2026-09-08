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
      <div className="flex items-start gap-2">
        <img src="/mascot.svg" alt="Tipu" className="w-6 h-6 mt-1 flex-shrink-0" />
        <div className="bg-white text-text rounded-2xl rounded-tl-md shadow-soft border border-border px-4 py-3">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-text-dim rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
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
            ? 'bg-primary/20 rounded-tr-md h-12'
            : 'bg-border rounded-tl-md h-16'
        }`}
      >
        <div className={`h-3 rounded-full ${isUser ? 'bg-primary/30 w-24' : 'bg-text-dim/30 w-32'}`}></div>
        {!isUser && (
          <div className="h-3 rounded-full bg-text-dim/20 w-20 mt-2"></div>
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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
      {messages.length === 0 && !isTyping && (
        <div className="flex flex-col items-center justify-center h-full px-4">
          <img src="/mascot.svg" alt="Tipu" className="w-24 h-24 mb-4 animate-pulse-soft" />
          <h2 className="text-xl font-bold text-text mb-1">Hi, I'm Tipu!</h2>
          <p className="text-text-muted text-center text-sm max-w-xs">
            Your personal AI companion. Ask me anything — I remember what you share.
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