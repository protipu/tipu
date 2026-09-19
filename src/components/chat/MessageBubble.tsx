import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types/chat';
import { TipuCharacter } from '../workspace/TipuCharacter';

interface MessageBubbleProps {
  message: Message;
  onDelete?: (messageId: string) => void;
  onOpenFocus?: (content: string) => void;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, onDelete, onOpenFocus }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.error;

  if (!message.content && !message.retrying) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group px-4 sm:px-0`}>
      <div className={`w-full ${isUser ? 'max-w-[85%] sm:max-w-[70%]' : 'max-w-3xl'}`}>
        {isUser ? (
          <div className="flex justify-end">
            <div
              className={`px-4 py-3 rounded-2xl rounded-br-md text-[15px] leading-relaxed ${isError ? 'text-red-400' : ''} ${message.deleting ? 'opacity-50' : ''}`}
              style={!isError ? {
                background: 'linear-gradient(135deg, rgba(201,162,75,0.15) 0%, rgba(201,162,75,0.08) 100%)',
                border: '1px solid rgba(201,162,75,0.2)',
                color: 'var(--text)',
              } : {
                background: 'rgba(212,106,106,0.1)',
                border: '1px solid rgba(212,106,106,0.2)',
              }}
            >
              {message.retrying ? (
                <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--gold)' }} />
                  Retrying...
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <TipuCharacter size="sm" mood={message.retrying ? 'thinking' : 'idle'} />
            </div>
            <div className={`flex-1 min-w-0 ${message.deleting ? 'opacity-50' : ''}`}>
              {message.retrying ? (
                <div className="flex items-center gap-2 text-sm py-2" style={{ color: 'var(--text-muted)' }}>
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--border-strong)', borderTopColor: 'var(--gold)' }} />
                  Retrying...
                </div>
              ) : isError ? (
                <div className="text-[15px] leading-relaxed py-2" style={{ color: 'var(--danger)' }}>{message.content}</div>
              ) : (
                <div className="text-[15px] leading-relaxed markdown-content py-2" style={{ color: 'var(--text)' }}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}
              <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>{formatTime(message.createdAt)}</span>
                {message.error && !message.retrying && (
                  <button className="text-[11px] transition-colors" style={{ color: 'var(--gold)' }}
                    onClick={() => window.dispatchEvent(new CustomEvent('retry-message', { detail: message.id }))}>
                    Retry
                  </button>
                )}
                {!isUser && !isError && !message.retrying && onOpenFocus && (
                  <button className="text-[11px] transition-colors hover:text-white" style={{ color: 'var(--text-faint)' }}
                    onClick={() => onOpenFocus(message.content)}>
                    Expand
                  </button>
                )}
                {isUser && onDelete && !message.error && (
                  <button className="text-[11px] transition-colors hover:text-red-400" style={{ color: 'var(--text-faint)' }}
                    onClick={() => onDelete(message.id)}>
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
