interface TipuCharacterProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  mood?: 'idle' | 'thinking' | 'happy' | 'listening';
}

export function TipuCharacter({ className = '', size = 'md', mood = 'idle' }: TipuCharacterProps) {
  const sizes = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-16 h-16 text-2xl',
    lg: 'w-24 h-24 text-4xl',
  };

  const moodShadow = {
    idle: '0 0 20px rgba(201,162,75,0.2)',
    thinking: '0 0 25px rgba(201,162,75,0.35)',
    happy: '0 0 30px rgba(201,162,75,0.4)',
    listening: '0 0 22px rgba(201,162,75,0.3)',
  };

  return (
    <div className={`relative inline-flex items-center justify-center ${className}`}>
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full animate-glow-pulse"
        style={{
          background: 'radial-gradient(circle, rgba(201,162,75,0.12) 0%, transparent 70%)',
          transform: 'scale(1.4)',
        }}
      />
      {/* Avatar */}
      <div
        className={`relative ${sizes[size]} rounded-full flex items-center justify-center font-bold animate-breathe`}
        style={{
          background: 'linear-gradient(135deg, #C9A24B 0%, #A0823A 100%)',
          color: '#0A0D16',
          boxShadow: moodShadow[mood],
          fontFamily: 'var(--font-serif)',
        }}
      >
        T
        {/* Thinking dots */}
        {mood === 'thinking' && (
          <div className="absolute -bottom-1 -right-1 flex gap-0.5">
            <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-soft)' }} />
            <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-soft)' }} />
            <span className="typing-dot w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold-soft)' }} />
          </div>
        )}
      </div>
    </div>
  );
}
