interface WorkspaceControlsProps {
  activeTab: 'chat' | 'memory' | 'settings';
  onTabChange: (tab: 'chat' | 'memory' | 'settings') => void;
}

export function WorkspaceControls({ activeTab, onTabChange }: WorkspaceControlsProps) {
  return (
    <nav className="flex items-center justify-around px-4 py-2"
      style={{ background: 'var(--surface-glass)', borderTop: '1px solid var(--border)' }}>
      <TabButton id="chat" label="Message" active={activeTab === 'chat'} onClick={() => onTabChange('chat')}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"/></svg>} />
      <TabButton id="memory" label="Memory" active={activeTab === 'memory'} onClick={() => onTabChange('memory')}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"/></svg>} />
      <TabButton id="settings" label="Settings" active={activeTab === 'settings'} onClick={() => onTabChange('settings')}
        icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 00-2 2v.18a2 2 0 01-1 1.73l-.43.25a2 2 0 01-2 0l-.15-.08a2 2 0 00-2.73.73l-.22.38a2 2 0 00.73 2.73l.15.1a2 2 0 011 1.72v.51a2 2 0 01-1 1.74l-.15.09a2 2 0 00-.73 2.73l.22.38a2 2 0 002.73.73l.15-.08a2 2 0 012 0l.43.25a2 2 0 011 1.73V20a2 2 0 002 2h.44a2 2 0 002-2v-.18a2 2 0 011-1.73l.43-.25a2 2 0 012 0l.15.08a2 2 0 002.73-.73l.22-.39a2 2 0 00-.73-2.73l-.15-.08a2 2 0 01-1-1.74v-.5a2 2 0 011-1.74l.15-.09a2 2 0 00.73-2.73l-.22-.38a2 2 0 00-2.73-.73l-.15.08a2 2 0 01-2 0l-.43-.25a2 2 0 01-1-1.73V4a2 2 0 00-2-2z"/><circle cx="12" cy="12" r="3"/></svg>} />
    </nav>
  );
}

function TabButton({ id, label, active, onClick, icon }: {
  id: string; label: string; active: boolean; onClick: () => void; icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all relative"
      style={{ color: active ? 'var(--gold)' : 'var(--text-faint)' }}
    >
      {icon}
      <span className="text-[10px] font-medium">{label}</span>
      {active && (
        <div className="absolute -bottom-0.5 w-1 h-1 rounded-full" style={{ background: 'var(--gold)' }} />
      )}
    </button>
  );
}
