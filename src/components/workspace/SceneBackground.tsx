export function SceneBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Sky gradient */}
      <div className="absolute inset-0" style={{
        background: `linear-gradient(180deg,
          var(--sky-top) 0%,
          var(--sky-mid) 35%,
          var(--sky-low) 60%,
          var(--sky-horizon) 80%,
          #5A7090 100%)`
      }} />

      {/* Stars / city lights */}
      <div className="absolute top-[15%] left-[10%] w-1 h-1 rounded-full bg-white/20 animate-glow-pulse" style={{ animationDuration: '4s' }} />
      <div className="absolute top-[12%] left-[25%] w-0.5 h-0.5 rounded-full bg-white/15" />
      <div className="absolute top-[18%] left-[60%] w-0.5 h-0.5 rounded-full bg-white/20" />
      <div className="absolute top-[10%] right-[20%] w-1 h-1 rounded-full bg-white/10" />
      <div className="absolute top-[22%] right-[35%] w-0.5 h-0.5 rounded-full bg-white/15" />

      {/* City skyline silhouette */}
      <div className="absolute bottom-[35%] left-0 right-0 h-[15%]" style={{
        background: `
          linear-gradient(180deg, transparent 0%, rgba(10,22,40,0.6) 100%),
          linear-gradient(to right,
            transparent 0%, transparent 5%,
            #0D1520 5%, #0D1520 8%,
            transparent 8%, transparent 12%,
            #0D1520 12%, #0D1520 14%,
            transparent 14%, transparent 18%,
            #0D1520 18%, #0D1520 22%,
            transparent 22%, transparent 28%,
            #0D1520 28%, #0D1520 30%,
            transparent 30%, transparent 35%,
            #0D1520 35%, #0D1520 38%,
            transparent 38%, transparent 42%,
            #0D1520 42%, #0D1520 48%,
            transparent 48%, transparent 52%,
            #0D1520 52%, #0D1520 55%,
            transparent 55%, transparent 60%,
            #0D1520 60%, #0D1520 63%,
            transparent 63%, transparent 68%,
            #0D1520 68%, #0D1520 72%,
            transparent 72%, transparent 78%,
            #0D1520 78%, #0D1520 82%,
            transparent 82%, transparent 88%,
            #0D1520 88%, #0D1520 92%,
            transparent 92%, transparent 100%
          )`
      }} />

      {/* Window frame — large */}
      <div className="absolute top-0 left-[8%] right-[8%] h-[65%] hidden lg:block"
        style={{ border: '3px solid var(--window-frame)', borderBottom: 'none', borderRadius: '12px 12px 0 0' }} />

      {/* Window panes — desktop */}
      <div className="absolute top-0 left-[8%] w-[44%] h-[65%] hidden lg:block"
        style={{ borderRight: '2px solid var(--window-frame)' }} />

      {/* Lamp glow — left */}
      <div className="absolute bottom-[30%] left-[5%] w-48 h-48 rounded-full hidden lg:block"
        style={{ background: 'radial-gradient(circle, var(--lamp-glow) 0%, transparent 70%)' }} />

      {/* Lamp glow — right */}
      <div className="absolute bottom-[25%] right-[12%] w-32 h-32 rounded-full hidden lg:block"
        style={{ background: 'radial-gradient(circle, rgba(255,200,120,0.04) 0%, transparent 70%)' }} />

      {/* Desk surface */}
      <div className="absolute bottom-0 left-0 right-0 h-[32%] hidden lg:block" style={{
        background: `linear-gradient(180deg,
          var(--desk) 0%,
          var(--desk-surface) 30%,
          var(--wood) 100%)`
      }} />

      {/* Desk edge highlight */}
      <div className="absolute bottom-[32%] left-0 right-0 h-px hidden lg:block"
        style={{ background: 'linear-gradient(90deg, transparent 10%, var(--wood-light) 30%, var(--wood-light) 70%, transparent 90%)' }} />

      {/* Bookshelf — left side */}
      <div className="absolute top-[8%] left-[2%] w-[5%] h-[55%] hidden xl:flex flex-col justify-between py-2" style={{ opacity: 0.6 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="w-full h-[18%] rounded-sm" style={{
            background: `linear-gradient(90deg, var(--shelf) 0%, ${i % 2 === 0 ? '#5A4838' : '#4A3828'} 100%)`,
            border: '1px solid rgba(255,255,255,0.03)'
          }}>
            <div className="flex h-full items-end px-0.5 gap-px pb-0.5">
              {[...Array(3 + (i % 2))].map((_, j) => (
                <div key={j} className="flex-1 rounded-sm" style={{
                  height: `${60 + (j * 10)}%`,
                  background: ['#8B6550','#5A7080','#7A6050','#6A5040','#5A6070'][j % 5],
                  opacity: 0.7
                }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Lamp — right side */}
      <div className="absolute bottom-[32%] right-[8%] hidden lg:flex flex-col items-center" style={{ opacity: 0.5 }}>
        <div className="w-8 h-12 rounded-t-full" style={{ background: 'linear-gradient(180deg, #D4A060 0%, #B08040 100%)' }} />
        <div className="w-1 h-16" style={{ background: '#5A4030' }} />
        <div className="w-12 h-2 rounded-full" style={{ background: '#4A3828' }} />
      </div>

      {/* Ambient light overlay */}
      <div className="absolute inset-0 hidden lg:block" style={{
        background: 'radial-gradient(ellipse at 50% 80%, rgba(255,200,120,0.03) 0%, transparent 60%)'
      }} />

      {/* Mobile: simplified warm overlay */}
      <div className="absolute inset-0 lg:hidden" style={{
        background: 'radial-gradient(ellipse at 50% 0%, rgba(201,162,75,0.04) 0%, transparent 50%)'
      }} />

      {/* Vignette */}
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(0,0,0,0.3) 100%)'
      }} />
    </div>
  );
}
