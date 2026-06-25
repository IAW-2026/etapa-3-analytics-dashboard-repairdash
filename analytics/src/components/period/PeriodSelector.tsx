'use client';
import { useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { CalendarRange } from 'lucide-react';
import { PRESET_LABELS, periodFromSearchParams, periodToQuery, resolvePeriod, type PeriodPreset } from '@/lib/period';

// Selector de período global. Vive en el Header y escribe preset/from/to en la
// URL; las páginas son Server Components que releen esos params y vuelven a
// consultar las APIs externas con el nuevo rango.
export function PeriodSelector() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const period = periodFromSearchParams(searchParams);
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const apply = (next: ReturnType<typeof resolvePeriod>) => {
    startTransition(() => {
      router.replace(`${pathname}?${periodToQuery(next)}`, { scroll: false });
    });
    setOpen(false);
  };
  const clearFilters = () => {
    startTransition(() => {
      router.replace(pathname, { scroll: false });
    });
    setOpen(false);
  };

  const presets: { key: PeriodPreset; label: string }[] = [
    { key: 'this-month', label: PRESET_LABELS['this-month'] },
    { key: 'last-30-days', label: PRESET_LABELS['last-30-days'] },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost flex items-center gap-2"
        style={{ opacity: pending ? 0.6 : 1 }}
      >
        <CalendarRange size={15} strokeWidth={1.9} />
        <span>{period.label}</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} className="fixed inset-0 z-30" />
          <div className="absolute right-0 top-[calc(100%+8px)] z-[31] w-[260px] bg-surface border border-border2 rounded-xl shadow-card p-3 flex flex-col gap-2">
            {presets.map((p) => {
              const active = period.preset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => apply(resolvePeriod(p.key))}
                  className="text-left border-none cursor-pointer rounded-[9px] px-3 py-[9px] text-[13.5px] font-semibold"
                  style={{
                    background: active ? 'var(--violet-soft)' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--text2)',
                  }}
                >
                  {p.label}
                </button>
              );
            })}

            <div className="border-t border-border pt-2.5 flex flex-col gap-2">
              <span className="text-[11.5px] text-text3 font-bold tracking-[.05em] uppercase">Rango personalizado</span>
              <label className="flex flex-col gap-1 text-xs text-text3">
                Desde
                <input
                  type="date"
                  defaultValue={period.from}
                  className="input-sm bg-bg text-text border border-border"
                  id="period-from"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-text3">
                Hasta
                <input
                  type="date"
                  defaultValue={period.to}
                  className="input-sm bg-bg text-text border border-border"
                  id="period-to"
                />
              </label>
              <button
                className="btn-primary mt-0.5"
                onClick={() => {
                  const from = (document.getElementById('period-from') as HTMLInputElement)?.value;
                  const to = (document.getElementById('period-to') as HTMLInputElement)?.value;
                  if (from && to && from <= to) apply(resolvePeriod('custom', from, to));
                }}
              >
                Aplicar rango
              </button>
            </div>
            <button
              className="btn-ghost mt-0.5 w-full justify-center"
              onClick={clearFilters}
            >
              Limpiar filtros
            </button>
          </div>
        </>
      )}
    </div>
  );
}
