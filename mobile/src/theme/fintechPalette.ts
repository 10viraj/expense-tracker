// Shared professional fintech palette (dark navy, crisp, trustworthy)
// Used by LoginScreen and RegisterScreen so both stay visually in sync.

export const lightPalette = {
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF1F6',
    surfaceElevated: '#FFFFFF',
    border: '#E2E6EE',
    glassBorder: '#E2E6EE',
    navy: '#0B1E39',
    navySoft: '#122A4D',
    accent: '#2F6FED',
    accentSoft: '#EAF1FF',
    accentDim: 'rgba(47, 111, 237, 0.08)',
    text: '#0B1220',
    textMuted: '#5B6472',
    textDim: '#98A1AF',
    placeholder: '#98A1AF',
    danger: '#E5484D',
    dangerDim: 'rgba(229, 72, 77, 0.08)',
    success: '#1FA971',
};

export const darkPalette = {
    bg: '#070D18',
    surface: '#0F1B30',
    surfaceAlt: '#132140',
    surfaceElevated: '#16294A',
    border: '#1E2E4F',
    glassBorder: 'rgba(255, 255, 255, 0.07)',
    navy: '#0B1E39',
    navySoft: '#16294A',
    accent: '#5B9CFF',
    accentSoft: '#122A4D',
    accentDim: 'rgba(91, 156, 255, 0.12)',
    text: '#EDF1F7',
    textMuted: '#8D97AC',
    textDim: '#5A6478',
    placeholder: '#5A6478',
    danger: '#FF6B6E',
    dangerDim: 'rgba(255, 107, 110, 0.12)',
    success: '#3FCB8F',
};

export type Palette = typeof lightPalette;