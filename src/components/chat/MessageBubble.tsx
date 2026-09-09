import { useRef, type MouseEvent } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      {!isUser && (
        <div className="flex-shrink-0 mr-2 mt-auto">
          <div
            className="w-[26px] h-[26px] rounded-full flex items-center justify-center text-[12px] border border-[rgba(201,162,75,0.16)]"
            style={{
              background: 'linear-gradient(160deg, #2A3358, #161C33)',
              fontFamily: 'var(--font-serif)',
              color: '#E8CE8C',
            }}
          >
            T
          </div>
        </div>
      )}
      <div className={`${isUser ? 'max-w-[78%]' : 'max-w-[78%]'} relative`}>
        {!isUser && (
          <div
            className={`px-3.5 py-2.5 rounded-2xl rounded-bl-md border ${
              isError
                ? 'bg-[#F87171]/10 border-[#F87171]/20 text-[#F87171]'
                : 'bg-[#131829] border-[rgba(201,162,75,0.16)] text-[#EDE9DE]'
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
              <div className="text-sm leading-relaxed markdown-content">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
              </div>
            )}
          </div>
        )}

        {isUser && (
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`px-3.5 py-2.5 rounded-2xl rounded-br-md border text-[#EDE9DE] transition-transform ${
              isError
                ? 'bg-[#F87171]/10 border-[#F87171]/20 text-[#F87171]'
                : 'border-[rgba(201,162,75,0.32)]'
            } ${message.deleting ? 'opacity-50' : ''}`}
            style={{
              background: isError ? undefined : 'rgba(201,162,75,0.14)',
              transition: 'transform 0.1s ease-out',
            }}
          >
            {message.retrying ? (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 border-2 border-[#C9A24B] border-t-transparent rounded-full animate-spin" />
                <span className="text-[#8891A8]">Retrying...</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            )}
          </div>
        )}

        <div className={`flex items-center gap-2 mt-1 px-0.5 ${isUser ? 'justify-end' : 'justify-start'}`}>
          <span className="text-[10.5px] text-[#5B6178]">{formatTime(message.createdAt)}</span>
          {message.error && !message.retrying && (
            <button
              className="text-[10px] font-medium text-[#C9A24B] hover:text-[#E8CE8C] transition-colors"
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
              className="text-[10px] font-medium text-[#5B6178] hover:text-[#F87171] opacity-0 group-hover:opacity-100 transition-opacity"
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
