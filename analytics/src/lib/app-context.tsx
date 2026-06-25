'use client';
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

interface AppContextValue {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
}

const Ctx = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const value: AppContextValue = {
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
