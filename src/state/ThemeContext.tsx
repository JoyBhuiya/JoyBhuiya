import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import type { ThemePreference } from '@/types/progress';
import { useProgress } from './ProgressContext';

interface ThemeContextValue {
  preference: ThemePreference;
  /** What is actually on screen once 'system' has been resolved. */
  resolved: 'light' | 'dark';
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-color-scheme: dark)').matches
    : false;
}

function resolve(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') return systemPrefersDark() ? 'dark' : 'light';
  return preference;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { state, updateSettings } = useProgress();
  const preference = state.settings.theme;

  useEffect(() => {
    const apply = () => {
      document.documentElement.dataset.theme = resolve(preference);
    };
    apply();

    if (preference !== 'system' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    query.addEventListener('change', apply);
    return () => query.removeEventListener('change', apply);
  }, [preference]);

  const value = useMemo(
    () => ({
      preference,
      resolved: resolve(preference),
      setPreference: (next: ThemePreference) => updateSettings({ theme: next }),
    }),
    [preference, updateSettings],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside a ThemeProvider');
  return context;
}
