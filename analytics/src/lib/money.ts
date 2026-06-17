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
