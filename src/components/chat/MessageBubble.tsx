import type { Message } from '../../types/chat';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.error;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-slide-up`}
    >
      <div
        className={`max-w-[80%] px-4 py-3 rounded-2xl transition-smooth ${
          isUser
            ? 'bg-gradient-to-br from-primary via-primary-hover to-primary-muted text-background rounded-br-lg shadow-warm'
            : 'bg-surface-gradient text-text rounded-bl-lg border border-border-light shadow-soft'
        } ${isError ? 'bg-error-bg border-error/40 text-error' : ''}`}
      >
        <p className="whitespace-pre-wrap text-base leading-relaxed">{message.content}</p>
        {message.retrying && (
          <div className="flex items-center gap-2 mt-2 text-sm">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <span className="text-text-muted">Retrying...</span>
          </div>
        )}
        {message.error && !message.retrying && (
          <button
            className="mt-2 text-sm font-medium text-primary hover:text-primary-hover transition-smooth"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(new CustomEvent('retry-message', { detail: message.id }));
            }}
          >
            Retry
          </button>
        )}
      </div>
    </div>
  );
}