// Helpers de formato compartidos por la UI.

// Número con separador de miles (es-AR). null/undefined → "—".
export function fnum(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return '—';
  return new Intl.NumberFormat('es-AR').format(v);
}

// Porcentaje. `v` es una fracción (0.031) o ya un porcentaje según `isFraction`.
export function fpct(v: number | null | undefined, isFraction = false, decimals = 1): string {
  if (v == null || !Number.isFinite(v)) return '—';
  const pct = isFraction ? v * 100 : v;
  return `${pct.toFixed(decimals)}%`;
}

// Fecha legible corta (es-AR). Acepta ISO string.
export function fdate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Promedio ponderado de calificaciones a partir de una distribución estrellas→cantidad.
export function weightedAverage(distribution: Array<{ estrellas: number; cantidad: number }>): number | null {
  const total = distribution.reduce((acc, d) => acc + d.cantidad, 0);
  if (total === 0) return null;
  const sum = distribution.reduce((acc, d) => acc + d.estrellas * d.cantidad, 0);
  return sum / total;
}

// Colores de marca por servicio (consistentes con la nav).
export const SERVICE_COLOR: Record<string, string> = {
  riderapp: 'var(--pink)',
  driver: 'var(--violet)',
  payments: 'var(--mag)',
  feedback: 'var(--pink)',
  promociones: 'var(--ok)',
};

// Paleta para los charts de Recharts (resuelta desde los tokens en runtime no es
// trivial dentro de SVG, así que usamos los hex equivalentes del tema oscuro).
export const CHART_COLORS = ['#9D6BFF', '#F26BB8', '#C964E0', '#52C98E', '#E0A94E', '#EF6470', '#6B8AFF'];
