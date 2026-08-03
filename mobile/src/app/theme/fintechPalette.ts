export interface ThemePalette {
  background: string;
  surface: string;
  primary: string;
  primaryLight: string;
  text: string;
  textMuted: string;
  border: string;
  error: string;
  success: string;
}

export const lightPalette: ThemePalette = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  primary: '#0F172A',
  primaryLight: '#334155',
  text: '#0F172A',
  textMuted: '#64748B',
  border: '#E2E8F0',
  error: '#EF4444',
  success: '#10B981',
};

export const darkPalette: ThemePalette = {
  background: '#0B0F19',
  surface: '#1E293B',
  primary: '#38BDF8',
  primaryLight: '#7DD3FC',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  border: '#334155',
  error: '#F87171',
  success: '#34D399',
};
