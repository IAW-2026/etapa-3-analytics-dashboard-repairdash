// Los montos de Payments/Promociones llegan como strings decimales con 2
// decimales (p.ej. "15000.00"). Para evitar errores de coma flotante al sumar
// muchos importes, operamos en centavos (enteros) y devolvemos number.

export function toCents(amount: string | number | null | undefined): number {
  if (amount == null) return 0;
  const n = typeof amount === 'number' ? amount : parseFloat(amount);
  if (!Number.isFinite(n)) return 0;
  return Math.round(n * 100);
}

export function centsToNumber(cents: number): number {
  return cents / 100;
}

// Suma una lista de importes string/number devolviendo un number con 2 decimales.
export function sumAmounts(amounts: Array<string | number | null | undefined>): number {
  const totalCents = amounts.reduce<number>((acc, a) => acc + toCents(a), 0);
  return centsToNumber(totalCents);
}

// Formato moneda para la UI (es-AR, ARS). Sin decimales para números grandes.
export function formatMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

function compactNumber(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 0,
  }).format(value);
}

// Formato corto para ejes de charts. El tooltip sigue usando formatMoney()
// para mostrar el monto completo.
export function formatCompactMoney(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return '—';
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) return `$${compactNumber(value / 1_000_000_000)}B`;
  if (abs >= 1_000_000) return `$${compactNumber(value / 1_000_000)}M`;
  if (abs >= 1_000) return `$${compactNumber(value / 1_000)}k`;
  return formatMoney(value);
}
