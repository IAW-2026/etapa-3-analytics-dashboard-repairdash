// Período global del dashboard. Es isomórfico (cliente + servidor): el selector
// del cliente escribe preset/from/to en la URL y las páginas (Server Components)
// lo reconstruyen con periodFromSearchParams().

export type PeriodPreset = 'this-month' | 'last-30-days' | 'custom';

export interface Period {
  preset: PeriodPreset;
  from: string;  // YYYY-MM-DD (inclusive)
  to: string;    // YYYY-MM-DD (inclusive)
  month: string; // YYYY-MM (granularidad mensual que usa Feedback)
  label: string;
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function toYM(ymd: string): string {
  return ymd.slice(0, 7);
}

export const PRESET_LABELS: Record<Exclude<PeriodPreset, 'custom'>, string> = {
  'this-month': 'Este mes',
  'last-30-days': 'Últimos 30 días',
};

// Resuelve un preset (o rango custom) a fechas concretas. `now` es inyectable
// para tests; por defecto usa la fecha actual.
export function resolvePeriod(
  preset: PeriodPreset,
  customFrom?: string,
  customTo?: string,
  now: Date = new Date(),
): Period {
  if (preset === 'custom' && customFrom && customTo) {
    return {
      preset: 'custom',
      from: customFrom,
      to: customTo,
      // Para Feedback (mensual) usamos el mes del extremo más reciente del rango.
      month: toYM(customTo),
      label: `${customFrom} → ${customTo}`,
    };
  }

  if (preset === 'last-30-days') {
    const to = new Date(now);
    const from = new Date(now);
    from.setDate(from.getDate() - 29);
    const toS = toYMD(to);
    return {
      preset: 'last-30-days',
      from: toYMD(from),
      to: toS,
      month: toYM(toS),
      label: PRESET_LABELS['last-30-days'],
    };
  }

  // this-month (default)
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const to = new Date(now);
  const toS = toYMD(to);
  return {
    preset: 'this-month',
    from: toYMD(from),
    to: toS,
    month: toYM(toS),
    label: PRESET_LABELS['this-month'],
  };
}

// Cantidad de días del período, acotada a [1, 31], para el endpoint de Payments
// /api/analytics/daily?days=N. Si el rango es inválido cae a 7 (default de la API).
export function periodDays(p: { from: string; to: string }): number {
  const diff = Math.round((new Date(p.to).getTime() - new Date(p.from).getTime()) / 86400000) + 1;
  return Math.min(31, Math.max(1, diff || 7));
}

export function periodToQuery(p: Period): string {
  const sp = new URLSearchParams({ from: p.from, to: p.to, month: p.month, preset: p.preset });
  return sp.toString();
}

// Reconstruye el Period a partir de los search params de la URL (objeto plano
// de Next —donde un valor puede repetirse y llegar como string[]— o un
// URLSearchParams). Si falta el preset cae a 'this-month'; un preset 'custom'
// usa from/to si están presentes.
type SearchParamsLike = Record<string, string | string[] | undefined> | URLSearchParams;

export function periodFromSearchParams(sp: SearchParamsLike): Period {
  const get = (k: 'preset' | 'from' | 'to'): string | undefined => {
    if (sp instanceof URLSearchParams) return sp.get(k) ?? undefined;
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const preset = (get('preset') as PeriodPreset) || 'this-month';
  return resolvePeriod(preset, get('from'), get('to'));
}
