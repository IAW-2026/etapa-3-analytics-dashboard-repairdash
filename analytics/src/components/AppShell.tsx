'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { AppProvider, useApp } from '@/lib/app-context';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';

// Chrome persistente compartido por todas las páginas: sidebar + header.
// Vive dentro del layout del route group para no desmontarse en cada navegación.
function Chrome({ children }: { children: ReactNode }) {
  const { sidebarOpen, closeSidebar } = useApp();
  const [winW, setWinW] = useState<number | null>(null);

  useEffect(() => {
    const onR = () => setWinW(window.innerWidth);
    setWinW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const isMobile = winW !== null && winW < 880;

  return (
    <div
      className="flex w-full h-dvh bg-bg text-text overflow-hidden"
      style={{ fontFamily: 'var(--font-instrument), sans-serif' }}
    >
      {isMobile && sidebarOpen && (
        <div onClick={closeSidebar} className="fixed inset-0 z-40 bg-[rgba(10,6,16,.55)]" />
      )}

      <Sidebar isMobile={isMobile} />

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header isMobile={isMobile} />
        <main className="flex-1 overflow-y-auto p-[clamp(16px,3vw,30px)]">
          {children}
        </main>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppProvider>
      <Chrome>{children}</Chrome>
    </AppProvider>
  );
}
