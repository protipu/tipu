// Theme configuration - single source of truth for all design tokens
// Modify this file to change the entire app's appearance without touching component logic

export const theme = {
  colors: {
    // Base backgrounds
    background: '#1A1612',
    backgroundElevated: '#231E1A',
    backgroundCard: '#2A2420',
    
    // Primary - warm gold
    primary: '#D4A843',
    primaryHover: '#E8C05A',
    primaryLight: '#F5E6B8',
    primaryMuted: '#8B7333',
    
    // Accent - soft blue
    accent: '#5BA4D9',
    accentHover: '#7BC0E8',
    accentLight: '#D6EEF8',
    
    // Text
    text: '#F5F0E8',
    textMuted: '#B8A898',
    textDim: '#8B7D6D',
    
    // Borders
    border: '#3D342C',
    borderLight: '#4A4038',
    
    // Status
    error: '#E86C5A',
    errorBg: '#3D1E1A',
    success: '#6BBF7A',
    warning: '#F0B84E',
  },
  
  fonts: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    serif: "'Merriweather', Georgia, serif",
  },
  
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  shadows: {
    soft: '0 2px 8px -2px rgb(0 0 0 / 0.3), 0 1px 3px -1px rgb(0 0 0 / 0.2)',
    warm: '0 4px 16px -4px rgb(212 168 67 / 0.2), 0 2px 8px -2px rgb(0 0 0 / 0.3)',
    glow: '0 0 24px -4px rgb(212 168 67 / 0.3), 0 4px 16px -4px rgb(0 0 0 / 0.4)',
    innerWarm: 'inset 0 1px 2px 0 rgb(212 168 67 / 0.1)',
  },
  
  gradients: {
    warm: 'linear-gradient(135deg, #1A1612 0%, #2D241C 50%, #1A1612 100%)',
    gold: 'linear-gradient(135deg, #D4A843 0%, #E8C05A 100%)',
    accent: 'linear-gradient(135deg, #5BA4D9 0%, #7BC0E8 100%)',
    surface: 'linear-gradient(180deg, #2A2420 0%, #231E1A 100%)',
  },
  
  transitions: {
    smooth: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  
  glass: {
    warm: 'rgba(38, 30, 26, 0.85)',
    card: 'rgba(42, 36, 32, 0.9)',
  },
} as const;

// CSS custom properties for use in global CSS
export const cssVars = {
  '--color-background': theme.colors.background,
  '--color-background-elevated': theme.colors.backgroundElevated,
  '--color-background-card': theme.colors.backgroundCard,
  '--color-primary': theme.colors.primary,
  '--color-primary-hover': theme.colors.primaryHover,
  '--color-primary-light': theme.colors.primaryLight,
  '--color-primary-muted': theme.colors.primaryMuted,
  '--color-accent': theme.colors.accent,
  '--color-accent-hover': theme.colors.accentHover,
  '--color-accent-light': theme.colors.accentLight,
  '--color-text': theme.colors.text,
  '--color-text-muted': theme.colors.textMuted,
  '--color-text-dim': theme.colors.textDim,
  '--color-border': theme.colors.border,
  '--color-border-light': theme.colors.borderLight,
  '--color-error': theme.colors.error,
  '--color-error-bg': theme.colors.errorBg,
  '--color-success': theme.colors.success,
  '--color-warning': theme.colors.warning,
  '--font-sans': theme.fonts.sans,
  '--font-serif': theme.fonts.serif,
  '--radius-sm': theme.radius.sm,
  '--radius-md': theme.radius.md,
  '--radius-lg': theme.radius.lg,
  '--radius-xl': theme.radius.xl,
  '--radius-full': theme.radius.full,
  '--shadow-soft': theme.shadows.soft,
  '--shadow-warm': theme.shadows.warm,
  '--shadow-glow': theme.shadows.glow,
  '--shadow-inner-warm': theme.shadows.innerWarm,
  '--gradient-warm': theme.gradients.warm,
  '--gradient-gold': theme.gradients.gold,
  '--gradient-accent': theme.gradients.accent,
  '--gradient-surface': theme.gradients.surface,
  '--transition-smooth': theme.transitions.smooth,
  '--glass-warm': theme.glass.warm,
  '--glass-card': theme.glass.card,
} as const;

export type Theme = typeof theme;