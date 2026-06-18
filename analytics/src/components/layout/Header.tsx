'use client';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { routeFromPath, ROUTE_META } from '@/lib/routes';
import { PeriodSelector } from '@/components/period/PeriodSelector';

// Páginas que muestran datos snapshot/totales (sin filtro temporal): no usan el
// selector de período, así que se oculta para evitar confusión.
const NO_PERIOD: ReadonlySet<string> = new Set(['overview', 'driver', 'riderapp']);

export function Header({ isMobile }: { isMobile: boolean }) {
  const { theme, setTheme, toggleSidebar } = useApp();
  const route = routeFromPath(usePathname());
  const meta = ROUTE_META[route];
  const showPeriod = !NO_PERIOD.has(route);

  return (
    <header style={{
      minHeight: 58, flexShrink: 0,
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px clamp(14px, 3vw, 28px)',
      borderBottom: '1px solid var(--border)',
      background: 'var(--surface)',
    }}>
      {isMobile && (
        <button
          onClick={toggleSidebar}
          aria-label="Abrir menú"
          style={{
            display: 'flex', flexDirection: 'column', gap: 4,
            background: 'none', border: '1px solid var(--border)',
            borderRadius: 9, padding: '9px 8px', cursor: 'pointer',
          }}
        >
          {[0, 1, 2].map((i) => (
            <span key={i} style={{ width: 16, height: 2, borderRadius: 2, background: 'var(--text2)', display: 'block' }} />
          ))}
        </button>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <span style={{ fontSize: 13, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{meta.group}</span>
        <span style={{ fontSize: 13, color: 'var(--text3)' }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{meta.title}</span>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
        {showPeriod && (
          <Suspense fallback={<span className="btn-ghost" style={{ opacity: 0.6 }}>Período</span>}>
            <PeriodSelector />
          </Suspense>
        )}
        {!isMobile && (
          <div style={{ display: 'flex', padding: 3, borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
            {(['light', 'dark'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                style={{
                  border: 'none', borderRadius: 999, padding: '5px 13px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  background: theme === t ? (t === 'light' ? 'var(--surface)' : 'var(--surface3)') : 'transparent',
                  color: theme === t ? 'var(--text)' : 'var(--text3)',
                  boxShadow: theme === t && t === 'light' ? '0 1px 4px rgba(20,10,40,.18)' : 'none',
                }}
              >
                {t === 'light' ? 'Claro' : 'Oscuro'}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
