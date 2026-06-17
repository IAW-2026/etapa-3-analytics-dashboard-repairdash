'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { AppProvider, useApp } from '@/lib/app-context';
import { Sidebar } from './layout/Sidebar';
import { Header } from './layout/Header';

// Chrome persistente compartido por todas las páginas: sidebar + header.
// Vive dentro del layout del route group para no desmontarse en cada navegación.
function Chrome({ children }: { children: ReactNode }) {
  const { theme, sidebarOpen, closeSidebar } = useApp();
  const [winW, setWinW] = useState(() => (typeof window === 'undefined' ? 1280 : window.innerWidth));

  useEffect(() => {
    const onR = () => setWinW(window.innerWidth);
    window.addEventListener('resize', onR);
    return () => window.removeEventListener('resize', onR);
  }, []);

  const isMobile = winW < 880;

  return (
    <div
      data-theme={theme}
      style={{
        display: 'flex', width: '100%', height: '100dvh',
        background: 'var(--bg)', color: 'var(--text)',
        fontFamily: 'var(--font-instrument), sans-serif',
        overflow: 'hidden',
      }}
    >
      {isMobile && sidebarOpen && (
        <div onClick={closeSidebar} style={{ position: 'fixed', inset: 0, background: 'rgba(10,6,16,.55)', zIndex: 40 }} />
      )}

      <Sidebar isMobile={isMobile} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: '100%' }}>
        <Header isMobile={isMobile} />
        <main style={{ flex: 1, overflowY: 'auto', padding: 'clamp(16px, 3vw, 30px)' }}>
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
