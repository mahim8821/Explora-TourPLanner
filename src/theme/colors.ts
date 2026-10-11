// ─── Minimal Color Palettes ──────────────────────────────────────────────────

export const DarkColors = {
  // Backgrounds
  background: '#1A1D16', // Deep earthy dark
  surface: '#262920',
  surfaceElevated: '#32362B',

  // Brand
  primary: '#0F3F35',
  primaryLight: 'rgba(15,63,53,0.15)',
  accent: '#1D6455',

  // Text
  text: '#ECE5D3',
  textSecondary: '#AEAEB2',
  textMuted: '#888C83',
  textInverse: '#1A1D16',

  // UI
  border: 'rgba(236,229,211,0.08)',
  borderStrong: 'rgba(236,229,211,0.14)',

  // Status
  success: '#34C759',
  error: '#FF3B30',
  warning: '#FF9500',
  info: '#0A84FF',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Legacy aliases (backward compat for screens not yet migrated)
  backgroundCard: '#262920',
  backgroundElevated: '#32362B',
  backgroundGlass: 'rgba(236,229,211,0.06)',
  glassBorder: 'rgba(236,229,211,0.08)',
  glassBorderStrong: 'rgba(236,229,211,0.14)',
  textPrimary: '#ECE5D3',
  textDark: '#1A1D16',
};

export const LightColors = {
  // Backgrounds
  background: '#FFFFFF', // Clean white
  surface: '#FFFFFF',
  surfaceElevated: '#F9FAFB', // Off-white for slight elevation

  // Brand
  primary: '#0F3F35', // Match startBtn color theme
  primaryLight: 'rgba(15,63,53,0.15)',
  accent: '#1D6455',

  // Text
  text: '#111827',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textInverse: '#FFFFFF',

  // UI
  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  // Status
  success: '#10B981',
  error: '#EF4444',
  warning: '#F59E0B',
  info: '#3B82F6',

  // Misc
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',

  // Legacy aliases
  backgroundCard: '#FFFFFF',
  backgroundElevated: '#F9FAFB',
  backgroundGlass: 'rgba(17, 24, 39, 0.03)',
  glassBorder: 'rgba(17, 24, 39, 0.08)',
  glassBorderStrong: 'rgba(17, 24, 39, 0.12)',
  textPrimary: '#111827',
  textDark: '#111827',
};

// Legacy default export (dark) — for files that haven't migrated to useTheme yet
export const Colors = DarkColors;

export type AppColors = typeof DarkColors;
