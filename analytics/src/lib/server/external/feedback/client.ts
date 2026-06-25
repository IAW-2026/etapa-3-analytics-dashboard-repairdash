import 'server-only';

import { CACHE_TAGS, CACHE_TTL } from '../../cache';
import { ENV, fbAnalyticsHeaders } from '../../config';
import type { FetchResult } from '../../http/types';
import { requestJson } from '../request';

const service = 'feedback' as const;
const tags = [CACHE_TAGS.feedback];

function request(endpoint: string, path: string, query: Record<string, string>): Promise<FetchResult<unknown>> {
  return requestJson({
    service,
    endpoint,
    baseUrl: ENV.feedback.base,
    apiKey: ENV.feedback.key,
    headers: fbAnalyticsHeaders,
    path,
    query,
    tags,
    ttl: CACHE_TTL.service,
  });
}

export interface FeedbackClientResponses {
  summary: FetchResult<unknown>;
  ratingsDistribution: FetchResult<unknown>;
  reportsBreakdown: FetchResult<unknown>;
}

export async function fetchFeedbackAnalytics(month: string, from?: string, to?: string): Promise<FeedbackClientResponses> {
  const query: Record<string, string> = { month };
  if (from != null) query.from = from;
  if (to != null) query.to = to;
  const [summary, ratingsDistribution, reportsBreakdown] = await Promise.all([
    request('summary', '/api/analytics/feedback/summary', query),
    request('ratings-distribution', '/api/analytics/feedback/ratings/distribution', query),
    request('reports-breakdown', '/api/analytics/feedback/reports/breakdown', query),
  ]);

  return { summary, ratingsDistribution, reportsBreakdown };
}
