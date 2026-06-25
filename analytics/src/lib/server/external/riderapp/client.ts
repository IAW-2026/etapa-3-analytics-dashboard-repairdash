import 'server-only';

import { CACHE_TAGS, CACHE_TTL } from '../../cache';
import { ENV, raHeaders } from '../../config';
import type { FetchResult } from '../../http/types';
import { requestJson } from '../request';

const service = 'riderapp' as const;
const tags = [CACHE_TAGS.riderapp];

function request(endpoint: string, path: string): Promise<FetchResult<unknown>> {
  return requestJson({
    service,
    endpoint,
    baseUrl: ENV.riderApp.base,
    apiKey: ENV.riderApp.key,
    headers: raHeaders,
    path,
    tags,
    ttl: CACHE_TTL.service,
  });
}

export interface RiderAppClientResponses {
  clientesCount: FetchResult<unknown>;
  viajesCount: FetchResult<unknown>;
  clientesList: FetchResult<unknown>;
  viajesList: FetchResult<unknown>;
}

export async function fetchRiderAppSuperAdmin(): Promise<RiderAppClientResponses> {
  const [clientesCount, viajesCount, clientesList, viajesList] = await Promise.all([
    request('clientes-count', '/api/super-admin/clientes/count'),
    request('viajes-count', '/api/super-admin/viajes/count'),
    request('clientes-list', '/api/super-admin/clientes'),
    request('viajes-list', '/api/super-admin/viajes'),
  ]);

  return { clientesCount, viajesCount, clientesList, viajesList };
}
