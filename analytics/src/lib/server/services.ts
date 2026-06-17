// Capa de agregación server-side: consulta las APIs reales documentadas de cada
// webapp y devuelve los shapes tipados de lib/types.ts. La usan tanto la route
// de overview (consolida las 5) como las routes de drill-down (una c/u).
//
// Todo es tolerante a fallos vía safeFetch: si un servicio no está configurado
// o responde mal, su sección queda en null/[] y el resto del dashboard sigue.

import { ENV, configured, raHeaders, drHeaders, pmHeaders, fbAnalyticsHeaders, promoHeaders } from './config';
import { safeFetch, paginate } from './fetchers';
import { CACHE_TAGS, CACHE_TTL } from './cache';
import { sumAmounts } from '@/lib/money';
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

/* ── Promociones ── */
export async function getPromociones(from: string, to: string): Promise<PromocionesData> {
  const base = ENV.promociones.base;
  const empty: PromocionesData = {
    ok: false, vigentes: null, programadas: null, vencidas: null, eliminadas: null,
    usos: null, ahorroTotal: null, valorOriginal: null, valorPagado: null,
    usosTruncated: false, porEstado: [], topPromos: [],
  };
  if (!configured(base)) return empty;

  const tags = [CACHE_TAGS.promociones];
  const h = promoHeaders();
  const countUrl = (estado: string) => `${base}/api/admin/promociones/count?estado=${estado}`;
  const cantidad = (j: Record<string, unknown> | null) =>
    num((j?.data as Record<string, unknown>)?.cantidad);

  const [vig, prog, venc, elim, histCount, histPage] = await Promise.all([
    safeFetch<Record<string, unknown>>(countUrl('vigentes'), h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(countUrl('programadas'), h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(countUrl('vencidas'), h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(countUrl('eliminadas'), h, tags, CACHE_TTL.service),
    safeFetch<Record<string, unknown>>(`${base}/api/historial/count?desde=${from}&hasta=${to}`, h, tags, CACHE_TTL.service),
    // Historial paginado (filtrado por rango en el server) → top promociones por usos.
    paginate<Record<string, unknown>>({
      buildUrl: (page) => `${base}/api/historial?desde=${from}&hasta=${to}&limit=100&page=${page}`,
      headers: h,
      tags,
      ttl: CACHE_TTL.service,
      extractItems: (j) => ((j as Record<string, unknown>)?.data as Record<string, unknown>[]) || [],
      extractTotalPages: (j) => num(((j as Record<string, unknown>)?.pagination as Record<string, unknown>)?.totalPages) || 1,
    }),
  ]);

  const vigentes = cantidad(vig);
  const programadas = cantidad(prog);
  const vencidas = cantidad(venc);
  const eliminadas = cantidad(elim);

  const aggr = (histCount?.data as Record<string, unknown>) || null;

  // Top promociones por usos en el rango (agrupando el historial paginado).
  const byPromo = new Map<string, number>();
  for (const u of histPage.items) {
    const promo = (u.promocion as Record<string, unknown>) || {};
    const nombre = (promo.nombre as string) || (u.nombre as string) || `promo ${u.promocionId}`;
    byPromo.set(nombre, (byPromo.get(nombre) || 0) + 1);
  }
  const topPromos = [...byPromo.entries()]
    .map(([nombre, usos]) => ({ nombre, usos }))
    .sort((a, b) => b.usos - a.usos)
    .slice(0, 8);

  const porEstado = [
    { estado: 'Vigentes', cantidad: vigentes ?? 0 },
    { estado: 'Programadas', cantidad: programadas ?? 0 },
    { estado: 'Vencidas', cantidad: vencidas ?? 0 },
  ];

  return {
    ok: vig != null || prog != null || venc != null || elim != null || histCount != null,
    vigentes,
    programadas,
    vencidas,
    eliminadas,
    usos: num(aggr?.totalUsos),
    ahorroTotal: num(aggr?.ahorroTotal),
    valorOriginal: num(aggr?.sumaValorOriginal),
    valorPagado: num(aggr?.sumaValorPagado),
    usosTruncated: histPage.truncated,
    porEstado,
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
      promocionesActivas: promociones.vigentes,
    },
    revenueSeries: payments.revenueSeries,
    transactionsByStatus: payments.transactionsByStatus,
    ratingsDistribution: feedback.ratingsDistribution,
    services: {
      riderapp: { ok: riderapp.ok, clientes: riderapp.clientes, viajes: riderapp.viajes },
      driver: { ok: driver.ok, workersOnline: driver.workers?.online ?? null, jobsActivos: driver.jobs?.activos ?? null },
      payments: { ok: payments.ok, transacciones, ingresos: payments.gmv },
      feedback: { ok: feedback.ok, reviews: feedback.reviewsDelMes, reportes: feedback.reportesDelMes },
      promociones: { ok: promociones.ok, activas: promociones.vigentes, usos: promociones.usos },
    },
  };
}
