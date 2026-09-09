import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-lg font-semibold text-white">Settings</h2>
          <p className="text-sm text-white/40 mt-0.5">Your account & preferences</p>
        </div>

        {/* Profile Card */}
        <div className="rounded-xl p-4 flex items-center gap-4" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0" style={{ background: '#C9A24B', color: '#212121' }}>
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] text-white truncate font-medium">{user?.email?.split('@')[0] || 'User'}</div>
            <div className="text-[13px] text-white/40 truncate mt-0.5">{user?.email}</div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <h3 className="text-xs text-white/30 uppercase tracking-wider font-medium mb-2 px-1">Preferences</h3>
          <div className="rounded-xl overflow-hidden" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}>
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M4 5h16M4 12h10M4 19h13" strokeLinecap="round"/></svg>}
              title="Reply language" sub="Always respond in Bengali" right={<span className="text-sm text-white/50">বাংলা</span>} />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/></svg>}
              title="Dark theme" sub="Always on"
              right={<Toggle on={true} />} />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" strokeLinecap="round"/></svg>}
              title="Daily check-in reminder" sub="9:00 PM"
              right={<Toggle on={true} />} last />
          </div>
        </div>

        {/* Memory & Data */}
        <div>
          <h3 className="text-xs text-white/30 uppercase tracking-wider font-medium mb-2 px-1">Memory & data</h3>
          <div className="rounded-xl overflow-hidden" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}>
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              title="Manage memory" sub="View, edit, or clear what Tipu knows"
              right={<Chevron />} />
            <SettingRow icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              title="Export my data" sub="Download everything as JSON"
              right={<Chevron />} last />
          </div>
        </div>

        {/* Account */}
        <div>
          <h3 className="text-xs text-white/30 uppercase tracking-wider font-medium mb-2 px-1">Account</h3>
          <div className="rounded-xl overflow-hidden" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                  <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm text-red-400 font-medium">Sign out</div>
            </button>
          </div>
        </div>

        <div className="pb-8" />
      </div>
    </div>
  );
}

function SettingRow({ icon, title, sub, right, last = false }: {
  icon: React.ReactNode; title: string; sub: string; right?: React.ReactNode; last?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${!last ? '' : ''}`}
      style={!last ? { borderBottom: '1px solid rgba(255,255,255,0.06)' } : undefined}>
      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-white/40" style={{ background: 'rgba(255,255,255,0.05)' }}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm text-white">{title}</div>
        <div className="text-[12px] text-white/35 mt-0.5">{sub}</div>
      </div>
      {right}
    </div>
  );
}

function Toggle({ on }: { on: boolean }) {
  return (
    <div className="w-9 h-5 rounded-full relative flex-shrink-0 transition-colors" style={{ background: on ? '#C9A24B' : 'rgba(255,255,255,0.15)' }}>
      <div className="w-4 h-4 rounded-full bg-white absolute top-[2px] transition-all" style={{ left: on ? '18px' : '2px' }} />
    </div>
  );
}

function Chevron() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/20"><path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}
