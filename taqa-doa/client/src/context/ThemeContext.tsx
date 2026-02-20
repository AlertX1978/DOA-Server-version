import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { Theme } from '../types';
import { themes } from '../styles/theme';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_KEY = 'doa-reader-theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem(THEME_KEY);
      if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(isDark));
    } catch { /* ignore */ }
  }, [isDark]);

  const theme = isDark ? themes.dark : themes.light;

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
