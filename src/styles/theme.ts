// Theme configuration - Blue/White modern theme
export const theme = {
  colors: {
    background: '#F0F4F8',
    backgroundElevated: '#FFFFFF',
    backgroundCard: '#FFFFFF',
    
    primary: '#2563EB',
    primaryHover: '#3B82F6',
    primaryLight: '#DBEAFE',
    primaryMuted: '#1D4ED8',
    
    accent: '#10B981',
    accentHover: '#34D399',
    accentLight: '#D1FAE5',
    
    text: '#1E293B',
    textMuted: '#64748B',
    textDim: '#94A3B8',
    
    border: '#E2E8F0',
    borderLight: '#F1F5F9',
    
    error: '#EF4444',
    errorBg: '#FEF2F2',
    success: '#10B981',
    warning: '#F59E0B',
    
    userBubble: '#2563EB',
    assistantBubble: '#FFFFFF',
  },
  
  fonts: {
    sans: "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  
  radius: {
    sm: '0.375rem',
    md: '0.5rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },
  
  shadows: {
    soft: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    medium: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    large: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    glow: '0 0 20px rgb(37 99 235 / 0.3)',
  },
  
  gradients: {
    primary: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)',
    warm: 'linear-gradient(135deg, #F0F4F8 0%, #E2E8F0 100%)',
  },
} as const;

export type Theme = typeof theme;