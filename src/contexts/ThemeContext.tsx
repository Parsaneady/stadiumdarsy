import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type ThemeMode = 'classic' | 'modern-light' | 'modern-dark';

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (t: ThemeMode) => void;
  cycleTheme: () => void;
}

const STORAGE_KEY = 'app-theme';
const DEFAULT_THEME: ThemeMode = 'modern-light';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const applyTheme = (theme: ThemeMode) => {
  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  // Tailwind's `dark:` selector relies on the `dark` class
  if (theme === 'modern-light') {
    root.classList.remove('dark');
  } else {
    root.classList.add('dark');
  }
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window === 'undefined') return DEFAULT_THEME;
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return stored ?? DEFAULT_THEME;
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (t: ThemeMode) => setThemeState(t);
  const cycleTheme = () => {
    setThemeState((cur) =>
      cur === 'modern-light' ? 'modern-dark' : cur === 'modern-dark' ? 'classic' : 'modern-light'
    );
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, cycleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
