import type { Message } from '../../types/chat';

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.error;

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-fade-in`}
    >
      <div
        className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
          isUser
            ? 'bg-primary text-white rounded-br-md'
            : 'bg-background-muted text-text rounded-bl-md'
        } ${isError ? 'bg-error-bg text-error border border-error/30' : ''}`}
      >
        <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</p>
        {message.retrying && (
          <div className="flex items-center gap-1.5 mt-1.5 text-xs">
            <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
            <span className="opacity-70">Retrying...</span>
          </div>
        )}
        {message.error && !message.retrying && (
          <button
            className="mt-1.5 text-xs font-medium text-primary hover:underline"
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