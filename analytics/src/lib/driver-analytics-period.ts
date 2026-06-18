import { toYMD, type Period } from './period';

export const DRIVER_ANALYTICS_MAX_RANGE_DAYS = 365;
export const DRIVER_ANALYTICS_EMPTY_MESSAGE = 'No hay datos disponibles para ese rango';

export interface DriverAnalyticsRange {
  from: string;
  to: string;
  valid: boolean;
  label: string;
  message?: string;
  reason?: 'invalid-format' | 'from-after-to' | 'range-too-large';
}

type SearchParamsLike = Record<string, string | string[] | undefined> | URLSearchParams;

function getParam(sp: SearchParamsLike, key: 'from' | 'to'): string | undefined {
  if (sp instanceof URLSearchParams) return sp.get(key) ?? undefined;
  const value = sp[key];
  return Array.isArray(value) ? value[0] : value;
}

function parseYmd(value: string | undefined): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null;
  }
  return parsed;
}

function daysInclusive(from: Date, to: Date): number {
  return Math.round((to.getTime() - from.getTime()) / 86_400_000) + 1;
}

export function defaultDriverAnalyticsRange(now: Date = new Date()): DriverAnalyticsRange {
  const to = new Date(now);
  const from = new Date(now);
  from.setDate(from.getDate() - 29);
  const fromText = toYMD(from);
  const toText = toYMD(to);
  return {
    from: fromText,
    to: toText,
    valid: true,
    label: `${fromText} a ${toText}`,
  };
}

function invalidRange(from: string, to: string, reason: DriverAnalyticsRange['reason']): DriverAnalyticsRange {
  return {
    from,
    to,
    valid: false,
    label: 'Rango invalido',
    message: DRIVER_ANALYTICS_EMPTY_MESSAGE,
    reason,
  };
}

export function driverAnalyticsRangeFromSearchParams(sp: SearchParamsLike): DriverAnalyticsRange {
  const defaultRange = defaultDriverAnalyticsRange();
  const fromRaw = getParam(sp, 'from');
  const toRaw = getParam(sp, 'to');

  if (!fromRaw && !toRaw) return defaultRange;

  const from = fromRaw || defaultRange.from;
  const to = toRaw || defaultRange.to;
  const fromDate = parseYmd(from);
  const toDate = parseYmd(to);

  if (!fromDate || !toDate) return invalidRange(from, to, 'invalid-format');
  if (fromDate.getTime() > toDate.getTime()) return invalidRange(from, to, 'from-after-to');
  if (daysInclusive(fromDate, toDate) > DRIVER_ANALYTICS_MAX_RANGE_DAYS) {
    return invalidRange(from, to, 'range-too-large');
  }

  return {
    from,
    to,
    valid: true,
    label: `${from} a ${to}`,
  };
}

export function driverAnalyticsRangeFromPeriod(period: Period): DriverAnalyticsRange {
  const fromDate = parseYmd(period.from);
  const toDate = parseYmd(period.to);

  if (!fromDate || !toDate) return invalidRange(period.from, period.to, 'invalid-format');
  if (fromDate.getTime() > toDate.getTime()) return invalidRange(period.from, period.to, 'from-after-to');
  if (daysInclusive(fromDate, toDate) > DRIVER_ANALYTICS_MAX_RANGE_DAYS) {
    return invalidRange(period.from, period.to, 'range-too-large');
  }

  return {
    from: period.from,
    to: period.to,
    valid: true,
    label: period.label,
  };
}
