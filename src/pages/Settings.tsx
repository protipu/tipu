import { useAuth } from '../context/AuthContext';

export function Settings() {
  const { signOut, user } = useAuth();

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 relative z-10">
      <div className="max-w-lg mx-auto space-y-6">

        {/* Profile */}
        <div className="flex items-center gap-3.5 pb-5 border-b border-hairline animate-slide-up">
          <div
            className="w-[52px] h-[52px] rounded-full flex items-center justify-center text-[#0A0D16] text-xl font-semibold flex-shrink-0"
            style={{
              background: 'radial-gradient(circle at 30% 25%, #E8CE8C, #C9A24B 60%, #8a6b28 100%)',
              fontFamily: 'var(--font-serif)',
              boxShadow: '0 0 0 1px rgba(201,162,75,0.35), 0 4px 14px rgba(201,162,75,0.18)',
            }}
          >
            {user?.email?.[0]?.toUpperCase() || '?'}
          </div>
          <div className="min-w-0">
            <div className="text-[17px] text-text truncate" style={{ fontFamily: 'var(--font-serif)' }}>
              {user?.email?.split('@')[0] || 'User'}
            </div>
            <div className="text-[12.5px] text-text-muted truncate mt-0.5">{user?.email}</div>
          </div>
        </div>

        {/* Preferences */}
        <div className="animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <div className="text-[11px] text-text-dim uppercase tracking-widest font-semibold mb-2 px-1">Preferences</div>
          <div className="glass rounded-2xl overflow-hidden border border-hairline">
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-hairline">
              <div className="w-[30px] h-[30px] rounded-[9px] bg-gold-dim flex items-center justify-center text-gold-soft flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M4 5h16M4 12h10M4 19h13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text">Reply language</div>
                <div className="text-[11.5px] text-text-muted mt-0.5">Always respond in Bengali</div>
              </div>
              <div className="text-[13px] text-text-muted">বাংলা</div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5 border-b border-hairline">
              <div className="w-[30px] h-[30px] rounded-[9px] bg-gold-dim flex items-center justify-center text-gold-soft flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M21 12.8A9 9 0 1111.2 3 7 7 0 0021 12.8z" stroke="currentColor" strokeWidth="1.6"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text">Dark theme</div>
                <div className="text-[11.5px] text-text-muted mt-0.5">Always on</div>
              </div>
              <div className="w-[38px] h-[22px] rounded-xl bg-primary/20 border border-primary relative flex-shrink-0">
                <div className="w-[16px] h-[16px] rounded-full bg-gold-soft absolute top-[2px] right-[2px]" />
              </div>
            </div>
            <div className="flex items-center gap-3 px-4 py-3.5">
              <div className="w-[30px] h-[30px] rounded-[9px] bg-gold-dim flex items-center justify-center text-gold-soft flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M18 8a6 6 0 00-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text">Daily check-in reminder</div>
                <div className="text-[11.5px] text-text-muted mt-0.5">9:00 PM</div>
              </div>
              <div className="w-[38px] h-[22px] rounded-xl bg-primary/20 border border-primary relative flex-shrink-0">
                <div className="w-[16px] h-[16px] rounded-full bg-gold-soft absolute top-[2px] right-[2px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Memory & data */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="text-[11px] text-text-dim uppercase tracking-widest font-semibold mb-2 px-1">Memory & data</div>
          <div className="glass rounded-2xl overflow-hidden border border-hairline">
            <button className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-hairline text-left hover:bg-white/[0.02] transition-smooth">
              <div className="w-[30px] h-[30px] rounded-[9px] bg-gold-dim flex items-center justify-center text-gold-soft flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3a9 9 0 100 18 9 9 0 000-18z" stroke="currentColor" strokeWidth="1.6"/><path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text">Manage memory</div>
                <div className="text-[11.5px] text-text-muted mt-0.5">View, edit, or clear what Tipu knows</div>
              </div>
              <div className="text-text-muted text-sm">&rsaquo;</div>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-white/[0.02] transition-smooth">
              <div className="w-[30px] h-[30px] rounded-[9px] bg-gold-dim flex items-center justify-center text-gold-soft flex-shrink-0">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M12 3v13m0 0l-4-4m4 4l4-4M4 19h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-text">Export my data</div>
                <div className="text-[11.5px] text-text-muted mt-0.5">Download everything as JSON</div>
              </div>
              <div className="text-text-muted text-sm">&rsaquo;</div>
            </button>
          </div>
        </div>

        {/* Account */}
        <div className="animate-slide-up" style={{ animationDelay: '0.15s' }}>
          <div className="text-[11px] text-text-dim uppercase tracking-widest font-semibold mb-2 px-1">Account</div>
          <div className="glass rounded-2xl overflow-hidden border border-hairline">
            <button
              onClick={() => signOut()}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-error/5 transition-smooth"
            >
              <div className="w-[30px] h-[30px] rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(184,101,79,0.16)', color: '#B8654F' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2M4 6h16M6 6l1 14a2 2 0 002 2h6a2 2 0 002-2l1-14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </div>
              <div className="text-sm" style={{ color: '#B8654F' }}>Sign out</div>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
