import 'server-only';

import type { FeedbackData } from '@/lib/types';
import { weightedAverage } from '@/lib/utils';
import type { FeedbackClientResponses } from './client';
import { asRecord, asRecordArray, dataOrNull, num, recordOfNumbers } from '../../domain/parsing';

const service = 'feedback' as const;

export const emptyFeedbackData: FeedbackData = {
  ok: false,
  reviewsDelMes: null,
  reportesDelMes: null,
  reportesContraCliente: null,
  reportesContraTrabajador: null,
  tasaReportes: null,
  ratingsDistribution: [],
  calificacionPromedio: null,
  reportsPorEstado: null,
  reportsPorDecision: null,
};

export function mapFeedbackData(responses: FeedbackClientResponses): FeedbackData {
  const summary = asRecord(dataOrNull(responses.summary), { service, endpoint: 'summary', path: 'root', traceId: responses.summary.traceId });
  const ratings = asRecord(dataOrNull(responses.ratingsDistribution), {
    service,
    endpoint: 'ratings-distribution',
    path: 'root',
    traceId: responses.ratingsDistribution.traceId,
  });
  const breakdown = asRecord(dataOrNull(responses.reportsBreakdown), {
    service,
    endpoint: 'reports-breakdown',
    path: 'root',
    traceId: responses.reportsBreakdown.traceId,
  });

  const ratingsDistribution = asRecordArray(ratings?.distribucion, {
    service,
    endpoint: 'ratings-distribution',
    path: 'distribucion',
    traceId: responses.ratingsDistribution.traceId,
  }).map((item) => ({
    estrellas: num(item.estrellas, { service, endpoint: 'ratings-distribution', path: 'estrellas' }) ?? 0,
    cantidad: num(item.cantidad, { service, endpoint: 'ratings-distribution', path: 'cantidad' }) ?? 0,
  }));

  return {
    ok: responses.summary.ok || responses.ratingsDistribution.ok || responses.reportsBreakdown.ok,
    reviewsDelMes: num(summary?.reviewsDelMes, { service, endpoint: 'summary', path: 'reviewsDelMes' }),
    reportesDelMes: num(summary?.reportesDelMes, { service, endpoint: 'summary', path: 'reportesDelMes' }),
    reportesContraCliente: num(summary?.reportesConFalloContraCliente, { service, endpoint: 'summary', path: 'reportesConFalloContraCliente' }),
    reportesContraTrabajador: num(summary?.reportesConFalloContraTrabajador, { service, endpoint: 'summary', path: 'reportesConFalloContraTrabajador' }),
    tasaReportes: null,
    ratingsDistribution,
    calificacionPromedio: weightedAverage(ratingsDistribution),
    reportsPorEstado: recordOfNumbers(breakdown?.porEstado, { service, endpoint: 'reports-breakdown', path: 'porEstado' }),
    reportsPorDecision: recordOfNumbers(breakdown?.porDecision, { service, endpoint: 'reports-breakdown', path: 'porDecision' }),
  };
}
