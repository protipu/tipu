import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Profile */}
        <div className="flex items-center gap-3.5 pb-5" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0"
            style={{ background: '#C9A24B', color: '#212121' }}
          >
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-[15px] text-white truncate">
              {user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="text-[13px] text-white/40 truncate mt-0.5">{user?.email}</div>
          </div>
        </div>

        {/* Preferences */}
        <div>
          <div className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-2 px-1">Preferences</div>
          <div className="rounded-xl overflow-hidden" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
                  <path d="M4 5h16M4 12h10M4 19h13" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">Reply language</div>
                <div className="text-[12px] text-white/40 mt-0.5">Always respond in Bengali</div>
              </div>
              <div className="text-[13px] text-white/40">বাংলা</div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
                  <path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">Dark theme</div>
                <div className="text-[12px] text-white/40 mt-0.5">Always on</div>
              </div>
              <div className="w-9 h-5 rounded-full relative flex-shrink-0" style={{ background: '#C9A24B' }}>
                <div className="w-4 h-4 rounded-full bg-white absolute top-[2px] right-[2px]" />
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
                  <path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" strokeLinecap="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">Daily check-in reminder</div>
                <div className="text-[12px] text-white/40 mt-0.5">9:00 PM</div>
              </div>
              <div className="w-9 h-5 rounded-full relative flex-shrink-0" style={{ background: '#C9A24B' }}>
                <div className="w-4 h-4 rounded-full bg-white absolute top-[2px] right-[2px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Memory & data */}
        <div>
          <div className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-2 px-1">Memory & data</div>
          <div className="rounded-xl overflow-hidden" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
                  <path d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">Manage memory</div>
                <div className="text-[12px] text-white/40 mt-0.5">View, edit, or clear what Tipu knows</div>
              </div>
              <div className="text-white/30 text-sm">&rsaquo;</div>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-white/50">
                  <path d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-white">Export my data</div>
                <div className="text-[12px] text-white/40 mt-0.5">Download everything as JSON</div>
              </div>
              <div className="text-white/30 text-sm">&rsaquo;</div>
            </button>
          </div>
        </div>

        {/* Account */}
        <div>
          <div className="text-[11px] text-white/30 uppercase tracking-wider font-medium mb-2 px-1">Account</div>
          <div className="rounded-xl overflow-hidden" style={{ background: '#2f2f2f', border: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.1)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-red-400">
                  <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="text-sm text-red-400">Sign out</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
