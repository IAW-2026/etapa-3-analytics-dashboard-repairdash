import 'server-only';

import { CACHE_TAGS, CACHE_TTL } from '../../cache';
import { driverAnalyticsHeaders, ENV } from '../../config';
import type { FetchResult } from '../../http/types';
import { requestJson } from '../request';

const service = 'driver' as const;
const tags = [CACHE_TAGS.driver];

function request(endpoint: string, path: string, query?: Record<string, string | number>): Promise<FetchResult<unknown>> {
  return requestJson({
    service,
    endpoint,
    baseUrl: ENV.driverAnalytics.base,
    apiKey: ENV.driverAnalytics.key,
    headers: driverAnalyticsHeaders,
    path,
    query,
    tags,
    ttl: CACHE_TTL.service,
  });
}

export interface DriverAnalyticsQuery {
  from: string;
  to: string;
}

export interface DriverClientResponses {
  summary: FetchResult<unknown>;
  jobsTimeseries: FetchResult<unknown>;
  serviceTypes: FetchResult<unknown>;
}

export async function fetchDriverAnalytics(query: DriverAnalyticsQuery): Promise<DriverClientResponses> {
  const range = { from: query.from, to: query.to };
  const [summary, jobsTimeseries, serviceTypes] = await Promise.all([
    request('summary', '/api/analytics/summary', range),
    request('jobs-timeseries', '/api/analytics/jobs-timeseries', { ...range, bucket: 'day' }),
    request('service-types', '/api/analytics/service-types', range),
  ]);

  return { summary, jobsTimeseries, serviceTypes };
}
