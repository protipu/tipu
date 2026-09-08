import { useRef, type MouseEvent } from 'react';
import type { Message } from '../../types/chat';

interface MessageBubbleProps {
  message: Message;
  onDelete?: (messageId: string) => void;
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.error;
  const isEmpty = !message.content && !message.retrying;
  const cardRef = useRef<HTMLDivElement>(null);

  if (isEmpty && !message.retrying) return null;

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card || !isUser) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -3;
    const rotateY = ((x - centerX) / centerX) * 3;
    card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = '';
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
      <div className="max-w-[80%] relative">
        {!isUser && (
          <div
            className={`px-4 py-3 rounded-2xl rounded-tl-md border ${
              isError
                ? 'bg-error/10 border-error/20 text-error'
                : 'glass-light border-border text-text'
            } ${message.deleting ? 'opacity-50' : ''}`}
          >
            {message.retrying ? (
              <div className="flex items-center gap-2 text-sm">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-wave" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-wave" style={{ animationDelay: '200ms' }} />
                  <div className="w-1.5 h-1.5 bg-primary rounded-full animate-wave" style={{ animationDelay: '400ms' }} />
                </div>
                <span className="text-text-muted text-xs">Retrying...</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            )}
          </div>
        )}

        {isUser && (
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`px-4 py-3 rounded-2xl rounded-tr-md bg-primary-gradient text-white shadow-medium transition-smooth ${
              isError ? 'bg-error' : ''
            } ${message.deleting ? 'opacity-50' : ''}`}
            style={{ transition: 'transform 0.1s ease-out, box-shadow 0.3s ease' }}
          >
            {message.retrying ? (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span className="text-white/80">Retrying...</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            )}
          </div>
        )}

        <div className={`flex items-center gap-2 mt-1.5 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10px] text-text-dim">{formatTime(message.createdAt)}</span>
          {message.error && !message.retrying && (
            <button
              className="text-[10px] font-medium text-primary hover:text-primary-hover transition-smooth"
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(new CustomEvent('retry-message', { detail: message.id }));
              }}
            >
              Retry
            </button>
          )}
          {isUser && onDelete && !message.error && (
            <button
              className="text-[10px] font-medium text-text-dim hover:text-error opacity-0 group-hover:opacity-100 transition-smooth"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(message.id);
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
