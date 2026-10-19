import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { preferencesApi } from '../services/api';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'theme';
export const THEME_EVENT = 'dz_theme_changed';

function readTheme(): Theme {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark';
  } catch {
    return 'dark';
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener('storage', onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener('storage', onChange);
  };
}

/** Single source of truth for the colour theme, shared by every component that renders a toggle. */
export function useTheme() {
  const theme = useSyncExternalStore(subscribe, readTheme, () => 'dark' as Theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the in-memory class change below still applies */
    }
    document.documentElement.classList.toggle('dark', next === 'dark');
    window.dispatchEvent(new Event(THEME_EVENT));
    // Persist for signed-in users; guests simply get a 401 which we ignore.
    preferencesApi.update({ theme: next }).catch(() => {});
  }, []);

  const toggle = useCallback(() => setTheme(theme === 'dark' ? 'light' : 'dark'), [theme, setTheme]);

  return { theme, isDark: theme === 'dark', setTheme, toggle };
}
