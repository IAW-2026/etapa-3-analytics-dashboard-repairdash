'use client';
import { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from '@/lib/app-context';
import { routeFromPath, ROUTE_META } from '@/lib/routes';
import { PeriodSelector } from '@/components/period/PeriodSelector';

// Páginas que muestran datos snapshot/totales (sin filtro temporal): no usan el
// selector de período, así que se oculta para evitar confusión.
const NO_PERIOD: ReadonlySet<string> = new Set(['overview', 'riderapp']);

export function Header({ isMobile }: { isMobile: boolean }) {
  const { toggleSidebar } = useApp();
  const route = routeFromPath(usePathname());
  const meta = ROUTE_META[route];
  const showPeriod = !NO_PERIOD.has(route);

  return (
    <header className="min-h-[58px] shrink-0 flex items-center gap-3.5 py-2.5 px-[clamp(14px,3vw,28px)] border-b border-border bg-surface">
      {isMobile && (
        <button
          onClick={toggleSidebar}
          aria-label="Abrir menú"
          className="flex flex-col gap-1 rounded-[9px] px-2 py-[9px] cursor-pointer bg-transparent border border-border"
        >
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-4 h-0.5 rounded-sm block bg-text2" />
          ))}
        </button>
      )}

      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[13px] text-text3 whitespace-nowrap">{meta.group}</span>
        <span className="text-[13px] text-text3">/</span>
        <span className="text-sm font-semibold whitespace-nowrap overflow-hidden text-ellipsis">{meta.title}</span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {showPeriod && (
          <Suspense fallback={<span className="btn-ghost opacity-60">Período</span>}>
            <PeriodSelector />
          </Suspense>
        )}
      </div>
    </header>
  );
}
