import { useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { useChatMemory } from '../hooks/useChatMemory';
import { useFocusView } from '../hooks/useFocusView';
import { renderMarkdown } from '../utils/format';
import { SceneBackground, WorkspaceHeader, WorkspaceControls, TipuCharacter } from '../components/workspace';
import { FocusView } from '../components/workspace/FocusView';
import { MessageList } from '../components/chat/MessageList';
import { MessageInput } from '../components/chat/MessageInput';
import { MemoryPage } from '../components/memory/MemoryPage';
import { Settings } from './Settings';

export function Chat() {
  const { signOut } = useAuth();
  const [view, setView] = useState<'chat' | 'memory' | 'settings'>('chat');
  const chat = useChat();
  const memory = useChatMemory();
  const focusView = useFocusView();

  const handleRetry = useCallback((messageId: string) => {
    const msg = chat.messages.find(m => m.id === messageId);
    if (msg) chat.retryMessage(msg.content);
  }, [chat]);

  return (
    <div className="h-screen flex flex-col relative overflow-hidden" style={{ background: 'var(--void)' }}>
      <SceneBackground />

      {/* Main content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex-shrink-0" style={{ background: 'var(--surface-glass)', backdropFilter: 'blur(12px)' }}>
          <WorkspaceHeader
            title="Tipu's Workspace"
            right={
              <button onClick={signOut} className="p-2 rounded-lg transition-colors hover:bg-white/5" style={{ color: 'var(--text-faint)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            }
          />
        </div>

        {/* View area */}
        <div className="flex-1 overflow-hidden">
          {view === 'chat' && (
            <div className="h-full flex flex-col">
              {/* Messages */}
              <div className="flex-1 overflow-hidden">
                <MessageList
                  messages={chat.messages}
                  isTyping={chat.isTyping}
                  error={chat.error}
                  onRetry={handleRetry}
                  onDelete={chat.deleteMessage}
                  onOpenFocus={(content) => focusView.open(content)}
                />
              </div>

              {/* Input */}
              <div className="flex-shrink-0" style={{ background: 'var(--surface-glass)', backdropFilter: 'blur(12px)' }}>
                <MessageInput
                  onSend={chat.sendMessage}
                  disabled={chat.isTyping}
                />
              </div>
            </div>
          )}
          {view === 'memory' && <MemoryPage />}
          {view === 'settings' && <Settings />}
        </div>

        {/* Bottom nav */}
        <div className="flex-shrink-0">
          <WorkspaceControls activeTab={view} onTabChange={setView} />
        </div>
      </div>

      {/* Focus view overlay */}
      {focusView.isOpen && (
        <FocusView
          content={focusView.content}
          onClose={focusView.close}
          renderMarkdown={renderMarkdown}
        />
      )}
    </div>
  );
}
