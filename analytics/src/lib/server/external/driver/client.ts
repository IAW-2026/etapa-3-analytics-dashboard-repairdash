import 'server-only';

import { CACHE_TAGS, CACHE_TTL } from '../../cache';
import { drHeaders, ENV } from '../../config';
import type { FetchResult } from '../../http/types';
import { requestJson } from '../request';

const service = 'driver' as const;
const tags = [CACHE_TAGS.driver];

function request(endpoint: string, path: string, query?: Record<string, string | number>): Promise<FetchResult<unknown>> {
  return requestJson({
    service,
    endpoint,
    baseUrl: ENV.driver.base,
    apiKey: ENV.driver.key,
    headers: drHeaders,
    path,
    query,
    tags,
    ttl: CACHE_TTL.service,
  });
}

export interface DriverClientResponses {
  summary: FetchResult<unknown>;
  finishedJobs: FetchResult<unknown>;
}

export async function fetchDriverControlPlane(): Promise<DriverClientResponses> {
  const [summary, finishedJobs] = await Promise.all([
    request('summary', '/api/control-plane/summary'),
    request('jobs-finalizados', '/api/control-plane/jobs', { estado: 'FINALIZADO', page: 1, limit: 1 }),
  ]);

  return { summary, finishedJobs };
}
