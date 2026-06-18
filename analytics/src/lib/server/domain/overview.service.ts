import 'server-only';

import { periodDays } from '@/lib/period';
import type { OverviewData } from '@/lib/types';
import { getDriver } from './driver.service';
import { getFeedback } from './feedback.service';
import { getPayments } from './payments.service';
import { getPromociones } from './promotions.service';
import { getRiderApp } from './riderapp.service';

function sumNullable(values: Array<number | null | undefined>): number | null {
  const present = values.filter((value): value is number => value != null);
  return present.length ? present.reduce((a, b) => a + b, 0) : null;
}

export async function getOverview(from: string, to: string, month: string): Promise<OverviewData> {
  const [payments, driver, riderapp, feedback, promociones] = await Promise.all([
    getPayments(month, periodDays({ from, to }), { from, to }),
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
