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

  if (!message.content && !message.retrying) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}>
      <div className={`w-full ${isUser ? 'max-w-[85%]' : 'max-w-3xl'}`}>
        {isUser ? (
          /* User message — right-aligned, clean bubble */
          <div className="flex justify-end">
            <div
              className={`px-4 py-2.5 rounded-2xl rounded-br-md text-[15px] leading-relaxed ${
                isError
                  ? 'bg-red-500/10 text-red-400'
                  : 'text-white'
              } ${message.deleting ? 'opacity-50' : ''}`}
              style={!isError ? { background: '#2f2f2f' } : undefined}
            >
              {message.retrying ? (
                <div className="flex items-center gap-2 text-sm text-white/50">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  Retrying...
                </div>
              ) : (
                <p className="whitespace-pre-wrap">{message.content}</p>
              )}
            </div>
          </div>
        ) : (
          /* Assistant message — left-aligned, no background */
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-0.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium"
                style={{ background: '#C9A24B', color: '#212121' }}
              >
                T
              </div>
            </div>
            <div className={`flex-1 min-w-0 ${message.deleting ? 'opacity-50' : ''}`}>
              {message.retrying ? (
                <div className="flex items-center gap-2 text-sm text-white/50 py-2">
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                  Retrying...
                </div>
              ) : isError ? (
                <div className="text-red-400 text-[15px] leading-relaxed py-2">{message.content}</div>
              ) : (
                <div className="text-white text-[15px] leading-relaxed markdown-content py-2">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
                </div>
              )}

              {/* Actions — show on hover */}
              <div className="flex items-center gap-3 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[11px] text-white/30">{formatTime(message.createdAt)}</span>
                {message.error && !message.retrying && (
                  <button
                    className="text-[11px] text-[#C9A24B] hover:text-[#E8CE8C] transition-colors"
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
                    className="text-[11px] text-white/30 hover:text-red-400 transition-colors"
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
        )}
      </div>
    </div>
  );
}
