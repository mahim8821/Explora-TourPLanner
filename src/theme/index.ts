import { Colors } from './colors';
import { Typography } from './typography';
import { Spacing, Radius, Shadow } from './spacing';

// Unified theme object (uses dark as default; screens should use useTheme() for dynamic colors)
export const theme = {
  colors: {
    background: Colors.background,
    surface: Colors.backgroundCard,
    surfaceLight: Colors.backgroundElevated,
    primary: Colors.primary,
    text: Colors.textPrimary,
    textSecondary: Colors.textSecondary,
    textMuted: Colors.textMuted,
    border: Colors.glassBorder,
    white: Colors.white,
    black: Colors.black,
    transparent: Colors.transparent,
    success: Colors.success,
    warning: Colors.warning,
    error: Colors.error,
    info: Colors.info,
  },
  typography: Typography,
  spacing: Spacing,
  radius: Radius,
  shadow: Shadow,
};

// Named exports for direct imports
export { Colors, DarkColors, LightColors } from './colors';
export type { AppColors } from './colors';
export { Typography } from './typography';
export { Spacing, Radius, Shadow } from './spacing';
export { ThemeProvider, useTheme } from './ThemeContext';
