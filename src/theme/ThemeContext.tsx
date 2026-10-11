import React, { createContext, useContext } from 'react';
import { useAppSelector } from '../store';
import { DarkColors, LightColors, AppColors } from './colors';

// ─── Context ─────────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colors: AppColors;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: DarkColors,
  isDark: true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────
// Must be placed INSIDE Redux <Provider> so it can read the store.

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const isDark = useAppSelector(s => s.settings.darkMode);
  const colors = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
