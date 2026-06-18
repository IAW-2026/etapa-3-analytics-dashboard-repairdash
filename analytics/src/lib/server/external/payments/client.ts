import 'server-only';

import { CACHE_TAGS, CACHE_TTL } from '../../cache';
import { ENV, pmHeaders } from '../../config';
import type { FetchResult } from '../../http/types';
import { requestJson } from '../request';

const service = 'payments' as const;
const tags = [CACHE_TAGS.payments];

function request(endpoint: string, path: string, query?: Record<string, string | number>): Promise<FetchResult<unknown>> {
  return requestJson({
    service,
    endpoint,
    baseUrl: ENV.payments.base,
    apiKey: ENV.payments.key,
    headers: pmHeaders,
    path,
    query,
    tags,
    ttl: CACHE_TTL.service,
  });
}

export interface PaymentsClientResponses {
  summary: FetchResult<unknown>;
  statusBreakdown: FetchResult<unknown>;
  settlementsSummary: FetchResult<unknown>;
  daily: FetchResult<unknown>;
}

export async function fetchPaymentsAnalytics(month: string, days: number): Promise<PaymentsClientResponses> {
  const [summary, statusBreakdown, settlementsSummary, daily] = await Promise.all([
    request('summary', '/api/analytics/summary', { month }),
    request('status-breakdown', '/api/analytics/status-breakdown', { month }),
    request('settlements-summary', '/api/analytics/settlements-summary', { month }),
    request('daily', '/api/analytics/daily', { days }),
  ]);

  return { summary, statusBreakdown, settlementsSummary, daily };
}
