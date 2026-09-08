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

  if (isEmpty && !message.retrying) return null;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up group`}
    >
      <div className="max-w-[80%] relative">
        {!isUser && (
          <div
            className={`px-4 py-3 rounded-2xl rounded-tl-md shadow-soft border border-border ${
              isError ? 'bg-error-bg border-error/20 text-error' : 'bg-white text-text'
            } ${message.deleting ? 'opacity-50' : ''}`}
          >
            {message.retrying ? (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                <span className="text-text-muted">Retrying...</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            )}
          </div>
        )}

        {isUser && (
          <div
            className={`px-4 py-3 rounded-2xl rounded-tr-md bg-primary text-white shadow-soft ${
              isError ? 'bg-error' : ''
            } ${message.deleting ? 'opacity-50' : ''}`}
          >
            {message.retrying ? (
              <div className="flex items-center gap-2 text-sm">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span className="text-white/80">Retrying...</span>
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
            )}
          </div>
        )}

        <div className={`flex items-center gap-2 mt-1 px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
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