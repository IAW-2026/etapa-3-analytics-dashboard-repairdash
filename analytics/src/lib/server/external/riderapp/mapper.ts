import 'server-only';

import type { RiderAppData } from '@/lib/types';
import { sumAmounts } from '@/lib/money';
import type { RiderAppClientResponses } from './client';
import { asRecord, asRecordArray, dataOrNull, num } from '../../domain/parsing';

const service = 'riderapp' as const;

export const emptyRiderAppData: RiderAppData = {
  ok: false,
  clientes: null,
  viajes: null,
  viajesConcluidos: null,
  ingresos: null,
  calificacionPromedio: null,
};

export function mapRiderAppData(responses: RiderAppClientResponses): RiderAppData {
  const clientesCount = asRecord(dataOrNull(responses.clientesCount), {
    service,
    endpoint: 'clientes-count',
    path: 'root',
    traceId: responses.clientesCount.traceId,
  });
  const viajesCount = asRecord(dataOrNull(responses.viajesCount), {
    service,
    endpoint: 'viajes-count',
    path: 'root',
    traceId: responses.viajesCount.traceId,
  });
  const clientesList = asRecord(dataOrNull(responses.clientesList), {
    service,
    endpoint: 'clientes-list',
    path: 'root',
    traceId: responses.clientesList.traceId,
  });
  const viajesList = asRecord(dataOrNull(responses.viajesList), {
    service,
    endpoint: 'viajes-list',
    path: 'root',
    traceId: responses.viajesList.traceId,
  });

  const clientes = asRecordArray(clientesList?.data, {
    service,
    endpoint: 'clientes-list',
    path: 'data',
    traceId: responses.clientesList.traceId,
  });
  const rated = clientes.map((cliente) => num(cliente.calificacion, { service, endpoint: 'clientes-list', path: 'data.calificacion' }))    .filter((n): n is number => n != null && n > 0);
  const calificacionPromedio = rated.length ? rated.reduce((a, b) => a + b, 0) / rated.length : null;

  const viajes = asRecordArray(viajesList?.data, {
    service,
    endpoint: 'viajes-list',
    path: 'data',
    traceId: responses.viajesList.traceId,
  });
  const viajesConcluidos = viajes.length ? viajes.filter((viaje) => viaje.estado === 'concluido').length : null;
  const montos: Array<string | number> = [];
  for (const viaje of viajes) {
    const pagos = viaje.pagos == null
      ? []
      : asRecordArray(viaje.pagos, { service, endpoint: 'viajes-list', path: 'data.pagos', traceId: responses.viajesList.traceId });
    for (const pago of pagos) {
      if (pago.estado === 'aceptado' && (typeof pago.monto === 'string' || typeof pago.monto === 'number')) {
        montos.push(pago.monto);
      }
    }
  }

  const clientesCountData = asRecord(clientesCount?.data, { service, endpoint: 'clientes-count', path: 'data', traceId: responses.clientesCount.traceId });
  const viajesCountData = asRecord(viajesCount?.data, { service, endpoint: 'viajes-count', path: 'data', traceId: responses.viajesCount.traceId });

  return {
    ok: responses.clientesCount.ok || responses.viajesCount.ok,
    clientes: num(clientesCountData?.total, { service, endpoint: 'clientes-count', path: 'data.total' }),
    viajes: num(viajesCountData?.total, { service, endpoint: 'viajes-count', path: 'data.total' }),
    viajesConcluidos,
    ingresos: viajes.length ? sumAmounts(montos) : null,
    calificacionPromedio,
  };
}
