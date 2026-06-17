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

  const presets: { key: PeriodPreset; label: string }[] = [
    { key: 'this-month', label: PRESET_LABELS['this-month'] },
    { key: 'last-30-days', label: PRESET_LABELS['last-30-days'] },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn-ghost"
        style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: pending ? 0.6 : 1 }}
      >
        <CalendarRange size={15} strokeWidth={1.9} />
        <span>{period.label}</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 30 }} />
          <div
            style={{
              position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 31,
              width: 260, background: 'var(--surface)', border: '1px solid var(--border2)',
              borderRadius: 14, boxShadow: 'var(--shadow)', padding: 12,
              display: 'flex', flexDirection: 'column', gap: 8,
            }}
          >
            {presets.map((p) => {
              const active = period.preset === p.key;
              return (
                <button
                  key={p.key}
                  onClick={() => apply(resolvePeriod(p.key))}
                  style={{
                    textAlign: 'left', border: 'none', cursor: 'pointer',
                    borderRadius: 9, padding: '9px 12px', fontSize: 13.5, fontWeight: 600,
                    background: active ? 'var(--violet-soft)' : 'transparent',
                    color: active ? 'var(--text)' : 'var(--text2)',
                  }}
                >
                  {p.label}
                </button>
              );
            })}

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 11.5, color: 'var(--text3)', fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase' }}>Rango personalizado</span>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text3)' }}>
                Desde
                <input
                  type="date"
                  defaultValue={period.from}
                  className="input-sm"
                  id="period-from"
                  style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: 'var(--text3)' }}>
                Hasta
                <input
                  type="date"
                  defaultValue={period.to}
                  className="input-sm"
                  id="period-to"
                  style={{ background: 'var(--bg)', color: 'var(--text)', border: '1px solid var(--border)' }}
                />
              </label>
              <button
                className="btn-primary"
                onClick={() => {
                  const from = (document.getElementById('period-from') as HTMLInputElement)?.value;
                  const to = (document.getElementById('period-to') as HTMLInputElement)?.value;
                  if (from && to && from <= to) apply(resolvePeriod('custom', from, to));
                }}
                style={{ marginTop: 2 }}
              >
                Aplicar rango
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
