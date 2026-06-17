'use client';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface AppContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

const THEME_KEY = 'an-theme';

export function AppProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Tema persistido en localStorage. Se lee en un efecto de montaje (no en el
  // initializer de useState) a propósito: el render del servidor y el primer
  // render del cliente deben coincidir en 'dark' para no romper la hidratación;
  // recién después aplicamos la preferencia guardada.
  useEffect(() => {
    const saved = (typeof window !== 'undefined' && localStorage.getItem(THEME_KEY)) as Theme | null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync de localStorage post-hydratación, una sola vez
    if (saved === 'light' || saved === 'dark') setThemeState(saved);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    if (typeof window !== 'undefined') localStorage.setItem(THEME_KEY, t);
  }, []);

  const value: AppContextValue = {
    theme,
    setTheme,
    sidebarOpen,
    toggleSidebar: useCallback(() => setSidebarOpen((s) => !s), []),
    closeSidebar: useCallback(() => setSidebarOpen(false), []),
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useApp debe usarse dentro de <AppProvider>');
  return ctx;
}
