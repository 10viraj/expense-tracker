export const Colors = {
  primary: '#6366f1', // Indigo 500
  primaryDark: '#4f46e5',
  primaryLight: '#818cf8',
  
  background: '#0f172a', // Slate 900
  card: '#1e293b', // Slate 800
  cardLight: '#334155', // Slate 700
  
  text: '#f8fafc', // Slate 50
  textMuted: '#94a3b8', // Slate 400
  
  success: '#10b981', // Emerald 500
  successBg: '#064e3b',
  
  danger: '#ef4444', // Red 500
  dangerBg: '#7f1d1d',

  border: '#334155',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
};

export const Radii = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const Typography = {
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    color: Colors.text,
  },
  bodyMuted: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  small: {
    fontSize: 12,
    color: Colors.textMuted,
  },
};
