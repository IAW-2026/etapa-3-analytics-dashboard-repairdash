// Capa de agregación server-side: consulta las APIs reales documentadas de cada
// webapp y devuelve los shapes tipados de lib/types.ts. La usan tanto la route
// de overview (consolida las 5) como las routes de drill-down (una c/u).
//
// Todo es tolerante a fallos vía safeFetch: si un servicio no está configurado
// o responde mal, su sección queda en null/[] y el resto del dashboard sigue.

import { ENV, configured, raHeaders, drHeaders, pmHeaders, fbAnalyticsHeaders, promoHeaders } from './config';
import { safeFetch, paginate } from './fetchers';
import { CACHE_TAGS, CACHE_TTL } from './cache';
import { sumAmounts, toCents, centsToNumber } from '@/lib/money';
import { weightedAverage } from '@/lib/utils';
import { periodDays } from '@/lib/period';
import type { PaymentsData, DriverData, RiderAppData, FeedbackData, PromocionesData, OverviewData } from '@/lib/types';

/* ── helpers ── */
function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === 'number' ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}
function rec(v: unknown): Record<string, number> | null {
  if (v && typeof v === 'object') {
    const out: Record<string, number> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const n = num(val);
      if (n != null) out[k] = n;
    }
    return out;
  }
  return null;
}
// YYYY-MM-DD inclusivo: compara solo la parte de fecha del ISO.
function inRange(iso: unknown, from: string, to: string): boolean {
  if (!iso || typeof iso !== 'string') return false;
  const ymd = iso.slice(0, 10);
  return ymd >= from && ymd <= to;
}
// `categorias` de una promo puede llegar como array o como string separado por
// comas (según la API). Normaliza siempre a string[] sin vacíos.
function normalizeCategorias(raw: unknown): string[] {
  const list = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split(',')
      : [];
  return list.map((c) => String(c).trim()).filter(Boolean);
}

/* ── Payments ── */
// Consume las APIs de analytics de Payments (/api/analytics/*): KPIs del mes,
// breakdown por estado, liquidaciones/retiros y serie diaria de GMV. Todos los
// montos llegan como string decimal → se parsean con num().
export async function getPayments(month: string, days: number): Promise<PaymentsData> {
  const base = ENV.payments.base;
  const empty: PaymentsData = {
    ok: false, gmv: null, paidTransactions: null, averageTicket: null,
    platformCommission: null, netToWorkers: null, failedTransactions: null,
    refundedTransactions: null, transactionsByStatus: null, amountByStatus: null,
    settlements: null, withdrawalsByStatus: null, revenueSeries: [],
  };
  if (!configured(base)) return empty;

  const tags = [CACHE_TAGS.payments];
  const h = pmHeaders();
  const [summary, breakdown, settlementsRes, daily] = await Promise.all([
    safeFetch<Record<string, unknown>>(`${base}/api/analytics/summary?month=${month}`, h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/analytics/status-breakdown?month=${month}`, h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/analytics/settlements-summary?month=${month}`, h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/analytics/daily?days=${days}`, h, tags, CACHE_TTL.service),
  ]);

  const kpis = (summary?.kpis as Record<string, unknown>) || null;

  // Breakdown por estado → conteo y monto.
  const statuses = (breakdown?.statuses as Record<string, unknown>[]) || null;
  let transactionsByStatus: Record<string, number> | null = null;
  let amountByStatus: Record<string, number> | null = null;
  if (statuses) {
    transactionsByStatus = {};
    amountByStatus = {};
    for (const s of statuses) {
      const st = s.status as string;
      if (!st) continue;
      transactionsByStatus[st] = num(s.count) ?? 0;
      amountByStatus[st] = num(s.amount) ?? 0;
    }
  }

  // Liquidaciones y retiros.
  const s = (settlementsRes?.settlements as Record<string, unknown>) || null;
  const settlements = s
    ? {
        liquidatedTransactions: num(s.liquidatedTransactions),
        liquidatedGross: num(s.liquidatedGross),
        commissionCollected: num(s.commissionCollected),
        netLiquidatedToWorkers: num(s.netLiquidatedToWorkers),
        withdrawalsRequested: num(s.withdrawalsRequested),
        withdrawalsApproved: num(s.withdrawalsApproved),
        withdrawalsRejected: num(s.withdrawalsRejected),
        withdrawalsAmountApproved: num(s.withdrawalsAmountApproved),
      }
    : null;
  const withdrawalsByStatus = s
    ? {
        REQUESTED: num(s.withdrawalsRequested) ?? 0,
        APPROVED: num(s.withdrawalsApproved) ?? 0,
        REJECTED: num(s.withdrawalsRejected) ?? 0,
      }
    : null;

  // Serie diaria de GMV.
  const buckets = (daily?.buckets as Record<string, unknown>[]) || [];
  const revenueSeries = buckets
    .map((b) => ({ date: (b.date as string) || '', total: num(b.gmv) ?? 0 }))
    .filter((b) => b.date);

  return {
    ok: summary != null || breakdown != null || settlementsRes != null || daily != null,
    gmv: num(kpis?.gmv),
    paidTransactions: num(kpis?.paidTransactions),
    averageTicket: num(kpis?.averageTicket),
    platformCommission: num(kpis?.platformCommission),
    netToWorkers: num(kpis?.netToWorkers),
    failedTransactions: num(kpis?.failedTransactions),
    refundedTransactions: num(kpis?.refundedTransactions),
    transactionsByStatus,
    amountByStatus,
    settlements,
    withdrawalsByStatus,
    revenueSeries,
  };
}

/* ── DriverApp ── */
export async function getDriver(): Promise<DriverData> {
  const base = ENV.driver.base;
  const empty: DriverData = { ok: false, workers: null, jobs: null, jobsFinalizados: null, serviceTypes: null };
  if (!configured(base)) return empty;

  const tags = [CACHE_TAGS.driver];
  const [summary, finalizados] = await Promise.all([
    safeFetch<Record<string, unknown>>(`${base}/api/control-plane/summary`, drHeaders(), tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/control-plane/jobs?estado=FINALIZADO&page=1&limit=1`, drHeaders(), tags, CACHE_TTL.service),
  ]);

  const data = (summary?.data as Record<string, unknown>) || null;
  const workers = (data?.workers as Record<string, unknown>) || null;
  const jobs = (data?.jobs as Record<string, unknown>) || null;
  const serviceTypes = (data?.serviceTypes as Record<string, unknown>) || null;
  const finPag = (finalizados?.pagination as Record<string, unknown>) || null;

  return {
    ok: summary != null,
    workers: workers ? { total: num(workers.total), online: num(workers.online), enTrabajo: num(workers.enTrabajo) } : null,
    jobs: jobs ? { activos: num(jobs.activos), pendientes: num(jobs.pendientes) } : null,
    jobsFinalizados: finPag ? num(finPag.total) : null,
    serviceTypes: serviceTypes ? { total: num(serviceTypes.total) } : null,
  };
}

/* ── RiderApp ── */
export async function getRiderApp(): Promise<RiderAppData> {
  const base = ENV.riderApp.base;
  const empty: RiderAppData = { ok: false, clientes: null, viajes: null, viajesConcluidos: null, ingresos: null, calificacionPromedio: null };
  if (!configured(base)) return empty;

  const tags = [CACHE_TAGS.riderapp];
  const h = raHeaders();
  const [clientesCount, viajesCount, clientesList, viajesList] = await Promise.all([
    safeFetch<Record<string, unknown>>(`${base}/api/super-admin/clientes/count`, h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/super-admin/viajes/count`, h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/super-admin/clientes`, h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/super-admin/viajes`, h, tags, CACHE_TTL.service),
  ]);

  // Promedio de calificación de clientes (ignora null).
  let calificacionPromedio: number | null = null;
  const clientes = (clientesList?.data as Record<string, unknown>[]) || null;
  if (clientes) {
    const rated = clientes.map((c) => num(c.calificacion)).filter((n): n is number => n != null);
    if (rated.length) calificacionPromedio = rated.reduce((a, b) => a + b, 0) / rated.length;
  }

  // Viajes concluidos + ingresos (suma de pagos aceptados).
  let viajesConcluidos: number | null = null;
  let ingresos: number | null = null;
  const viajes = (viajesList?.data as Record<string, unknown>[]) || null;
  if (viajes) {
    viajesConcluidos = viajes.filter((v) => v.estado === 'concluido').length;
    const montos: Array<string | number> = [];
    for (const v of viajes) {
      const pagos = (v.pagos as Record<string, unknown>[]) || [];
      for (const p of pagos) {
        if (p.estado === 'aceptado') montos.push((p.monto as string | number) ?? 0);
      }
    }
    ingresos = sumAmounts(montos);
  }

  return {
    ok: clientesCount != null || viajesCount != null,
    clientes: num((clientesCount?.data as Record<string, unknown>)?.total),
    viajes: num((viajesCount?.data as Record<string, unknown>)?.total),
    viajesConcluidos,
    ingresos,
    calificacionPromedio,
  };
}

/* ── Feedback ── */
export async function getFeedback(month: string): Promise<FeedbackData> {
  const base = ENV.feedback.base;
  const empty: FeedbackData = {
    ok: false, reviewsDelMes: null, reportesDelMes: null, reportesContraCliente: null,
    reportesContraTrabajador: null, tasaReportes: null, ratingsDistribution: [],
    calificacionPromedio: null, reportsPorEstado: null, reportsPorDecision: null,
  };
  if (!configured(base)) return empty;

  const tags = [CACHE_TAGS.feedback];
  const h = fbAnalyticsHeaders();
  const [summary, dist, breakdown] = await Promise.all([
    safeFetch<Record<string, unknown>>(`${base}/api/analytics/feedback/summary?month=${month}`, h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/analytics/feedback/ratings/distribution?month=${month}`, h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/analytics/feedback/reports/breakdown?month=${month}`, h, tags, CACHE_TTL.service),
  ]);

  const distribucion = ((dist?.distribucion as Record<string, unknown>[]) || [])
    .map((d) => ({ estrellas: num(d.estrellas) ?? 0, cantidad: num(d.cantidad) ?? 0 }));

  return {
    ok: summary != null || dist != null || breakdown != null,
    reviewsDelMes: num(summary?.reviewsDelMes),
    reportesDelMes: num(summary?.reportesDelMes),
    reportesContraCliente: num(summary?.reportesConFalloContraCliente),
    reportesContraTrabajador: num(summary?.reportesConFalloContraTrabajador),
    tasaReportes: num(summary?.tasaReportessobreTrabajos),
    ratingsDistribution: distribucion,
    calificacionPromedio: weightedAverage(distribucion),
    reportsPorEstado: rec(breakdown?.porEstado),
    reportsPorDecision: rec(breakdown?.porDecision),
  };
}

/* ── Service types (DriverApp) ── */
// Mapa id→nombre de los tipos de servicio. Las categorías de las promociones se
// guardan como IDs de service-type; este mapa permite mostrar el nombre legible.
// Tolerante a fallos: si DriverApp no está configurado o falla, devuelve {}.
export async function getServiceTypes(): Promise<Record<string, string>> {
  const base = ENV.driver.base;
  if (!configured(base)) return {};

  const page = await paginate<Record<string, unknown>>({
    buildUrl: (p) => `${base}/api/control-plane/service-types?limit=100&page=${p}`,
    headers: drHeaders(),
    tags: [CACHE_TAGS.driver],
    ttl: CACHE_TTL.service,
    extractItems: (j) => ((j as Record<string, unknown>)?.data as Record<string, unknown>[]) || [],
    extractTotalPages: (j) => num(((j as Record<string, unknown>)?.pagination as Record<string, unknown>)?.totalPages) || 1,
  });

  const map: Record<string, string> = {};
  for (const s of page.items) {
    const id = s.id as string;
    const nombre = s.nombre as string;
    if (id && nombre) map[id] = nombre;
  }
  return map;
}

/* ── Promociones ── */
export async function getPromociones(from: string, to: string): Promise<PromocionesData> {
  const base = ENV.promociones.base;
  const empty: PromocionesData = {
    ok: false, activas: null, usos: null, volumenDescuento: null,
    usosTruncated: false, porCategoria: [], topPromos: [],
  };
  if (!configured(base)) return empty;

  const tags = [CACHE_TAGS.promociones];
  const h = promoHeaders();

  // Lista de promociones activas (paginada) + nombres de tipos de servicio
  // (DriverApp), para tally por categoría con etiquetas legibles.
  const [promoPage, serviceTypes] = await Promise.all([
    paginate<Record<string, unknown>>({
      buildUrl: (page) => `${base}/api/admin/promociones?eliminada=false&limit=100&page=${page}`,
      headers: h,
      tags,
      ttl: CACHE_TTL.service,
      extractItems: (j) => ((j as Record<string, unknown>)?.data as Record<string, unknown>[]) || [],
      extractTotalPages: (j) => num(((j as Record<string, unknown>)?.pagination as Record<string, unknown>)?.totalPages) || 1,
    }),
    getServiceTypes(),
  ]);

  // Resuelve el ID de categoría a su nombre (DriverApp); si no es un ID conocido
  // (p.ej. "sin categoría"), conserva la etiqueta original. `categorias` puede
  // venir como array o como string separado por comas → se normaliza a string[].
  const catCount = new Map<string, number>();
  for (const p of promoPage.items) {
    const cats = normalizeCategorias(p.categorias);
    const labels = cats.length === 0 ? ['sin categoría'] : cats.map((c) => serviceTypes[c] ?? c);
    for (const l of labels) catCount.set(l, (catCount.get(l) || 0) + 1);
  }
  const porCategoria = [...catCount.entries()]
    .map(([categoria, cantidad]) => ({ categoria, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad);

  // Historial de uso (paginado) → filtrar por fechaUso en el rango, sumar descuento.
  const histPage = await paginate<Record<string, unknown>>({
    buildUrl: (page) => `${base}/api/historial?limit=100&page=${page}`,
    headers: h,
    tags,
    ttl: CACHE_TTL.service,
    extractItems: (j) => ((j as Record<string, unknown>)?.data as Record<string, unknown>[]) || [],
    extractTotalPages: (j) => num(((j as Record<string, unknown>)?.pagination as Record<string, unknown>)?.totalPages) || 1,
  });

  const usosEnRango = histPage.items.filter((u) => inRange(u.fechaUso, from, to));
  const descuentoCents = usosEnRango.reduce((acc, u) => {
    const orig = toCents(u.valorOriginal as number);
    const pagado = toCents(u.valorPagado as number);
    return acc + Math.max(0, orig - pagado);
  }, 0);

  // Top promociones por usos (dentro del rango).
  const byPromo = new Map<string, { usos: number; descuentoCents: number }>();
  for (const u of usosEnRango) {
    const nombre = (u.nombre as string) || `promo ${u.promocionId}`;
    const cur = byPromo.get(nombre) || { usos: 0, descuentoCents: 0 };
    cur.usos += 1;
    cur.descuentoCents += Math.max(0, toCents(u.valorOriginal as number) - toCents(u.valorPagado as number));
    byPromo.set(nombre, cur);
  }
  const topPromos = [...byPromo.entries()]
    .map(([nombre, v]) => ({ nombre, usos: v.usos, descuento: centsToNumber(v.descuentoCents) }))
    .sort((a, b) => b.usos - a.usos)
    .slice(0, 8);

  return {
    ok: promoPage.totalPages > 0 || histPage.totalPages > 0,
    activas: promoPage.items.length,
    usos: usosEnRango.length,
    volumenDescuento: centsToNumber(descuentoCents),
    usosTruncated: histPage.truncated,
    porCategoria,
    topPromos,
  };
}

/* ── Overview consolidado ── */
// Devuelve null si todos los sumandos son null; si no, suma los no-null.
function sumNullable(values: Array<number | null | undefined>): number | null {
  const present = values.filter((v): v is number => v != null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

// Consolida los KPIs de las 5 webapps en una sola respuesta. Cada agregador es
// tolerante a fallos, así que un servicio caído no rompe el resto del overview.
export async function getOverview(from: string, to: string, month: string): Promise<OverviewData> {
  const [payments, driver, riderapp, feedback, promociones] = await Promise.all([
    getPayments(month, periodDays({ from, to })),
    getDriver(),
    getRiderApp(),
    getFeedback(month),
    getPromociones(from, to),
  ]);

  const transacciones = payments.transactionsByStatus
    ? Object.values(payments.transactionsByStatus).reduce((a, b) => a + b, 0)
    : null;

  return {
    period: { from, to, month },
    kpis: {
      ingresos: payments.gmv,
      transacciones,
      usuariosActivos: sumNullable([riderapp.clientes, driver.workers?.total]),
      pedidosCompletados: sumNullable([driver.jobsFinalizados, riderapp.viajesConcluidos]),
      calificacionPromedio: feedback.calificacionPromedio ?? riderapp.calificacionPromedio,
      promocionesActivas: promociones.activas,
    },
    revenueSeries: payments.revenueSeries,
    transactionsByStatus: payments.transactionsByStatus,
    ratingsDistribution: feedback.ratingsDistribution,
    services: {
      riderapp: { ok: riderapp.ok, clientes: riderapp.clientes, viajes: riderapp.viajes },
      driver: { ok: driver.ok, workersOnline: driver.workers?.online ?? null, jobsActivos: driver.jobs?.activos ?? null },
      payments: { ok: payments.ok, transacciones, ingresos: payments.gmv },
      feedback: { ok: feedback.ok, reviews: feedback.reviewsDelMes, reportes: feedback.reportesDelMes },
      promociones: { ok: promociones.ok, activas: promociones.activas, usos: promociones.usos },
    },
  };
}
