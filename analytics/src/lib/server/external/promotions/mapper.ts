import 'server-only';

import type { PromocionesData } from '@/lib/types';
import type { PromotionsClientResponses } from './client';
import { asRecord, dataOrNull, num } from '../../domain/parsing';

const service = 'promotions' as const;

export const emptyPromocionesData: PromocionesData = {
  ok: false,
  vigentes: null,
  programadas: null,
  vencidas: null,
  eliminadas: null,
  usos: null,
  ahorroTotal: null,
  valorOriginal: null,
  valorPagado: null,
  usosTruncated: false,
  porEstado: [],
  topPromos: [],
};

function countFrom(response: { ok: boolean; traceId: string }, endpoint: string): number | null {
  const root = asRecord(dataOrNull(response as PromotionsClientResponses['vigentes']), { service, endpoint, path: 'root', traceId: response.traceId });
  const data = asRecord(root?.data, { service, endpoint, path: 'data', traceId: response.traceId });
  return num(data?.cantidad, { service, endpoint, path: 'data.cantidad' });
}

export function mapPromocionesData(responses: PromotionsClientResponses): PromocionesData {
  const vigentes = countFrom(responses.vigentes, 'count-vigentes');
  const programadas = countFrom(responses.programadas, 'count-programadas');
  const vencidas = countFrom(responses.vencidas, 'count-vencidas');
  const eliminadas = countFrom(responses.eliminadas, 'count-eliminadas');

  const historialCount = asRecord(dataOrNull(responses.historialCount), {
    service,
    endpoint: 'historial-count',
    path: 'root',
    traceId: responses.historialCount.traceId,
  });
  const aggr = asRecord(historialCount?.data, {
    service,
    endpoint: 'historial-count',
    path: 'data',
    traceId: responses.historialCount.traceId,
  });

  const byPromo = new Map<string, number>();
  for (const item of responses.historial.items) {
    const promo = asRecord(item.promocion, { service, endpoint: 'historial', path: 'item.promocion' }) ?? {};
    const nombre = typeof promo.nombre === 'string'
      ? promo.nombre
      : typeof item.nombre === 'string'
        ? item.nombre
        : `promo ${String(item.promocionId ?? '')}`.trim();
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
    ok: responses.vigentes.ok || responses.programadas.ok || responses.vencidas.ok || responses.eliminadas.ok || responses.historialCount.ok,
    vigentes,
    programadas,
    vencidas,
    eliminadas,
    usos: num(aggr?.totalUsos, { service, endpoint: 'historial-count', path: 'data.totalUsos' }),
    ahorroTotal: num(aggr?.ahorroTotal, { service, endpoint: 'historial-count', path: 'data.ahorroTotal' }),
    valorOriginal: num(aggr?.sumaValorOriginal, { service, endpoint: 'historial-count', path: 'data.sumaValorOriginal' }),
    valorPagado: num(aggr?.sumaValorPagado, { service, endpoint: 'historial-count', path: 'data.sumaValorPagado' }),
    usosTruncated: responses.historial.truncated,
    porEstado,
    topPromos,
  };
}
