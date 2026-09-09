import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Message } from '../../types/chat';

interface MessageBubbleProps {
  message: Message;
  onDelete?: (messageId: string) => void;
}

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function MessageBubble({ message, onDelete }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.error;

  if (!message.content && !message.retrying) return null;

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} group px-4 sm:px-0`}>
      <div className={`w-full ${isUser ? 'max-w-[85%] sm:max-w-[70%]' : 'max-w-3xl'}`}>
        {isUser ? (
          <div className="flex justify-end">
            <div
              className={`px-4 py-3 rounded-2xl rounded-br-md text-[15px] leading-relaxed ${isError ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''} ${message.deleting ? 'opacity-50' : ''}`}
              style={!isError ? { background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.12)' } : undefined}
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
          <div className="flex gap-3">
            <div className="flex-shrink-0 mt-1">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold" style={{ background: '#C9A24B', color: '#212121' }}>T</div>
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
              <div className="flex items-center gap-3 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[11px] text-white/25">{formatTime(message.createdAt)}</span>
                {message.error && !message.retrying && (
                  <button className="text-[11px] text-[#C9A24B] hover:text-[#E8CE8C] transition-colors"
                    onClick={() => window.dispatchEvent(new CustomEvent('retry-message', { detail: message.id }))}>
                    Retry
                  </button>
                )}
                {isUser && onDelete && !message.error && (
                  <button className="text-[11px] text-white/25 hover:text-red-400 transition-colors"
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
