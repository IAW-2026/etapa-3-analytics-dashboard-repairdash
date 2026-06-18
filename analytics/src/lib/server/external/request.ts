import 'server-only';

import type { CacheTag } from '../cache';
import { fetchJson, invalidUrlResult, notConfiguredResult } from '../http/fetcher';
import type { FetchResult, ServiceName } from '../http/types';
import { buildUrl, type QueryValue } from '../http/url';

interface RequestJsonOptions {
  service: ServiceName;
  endpoint: string;
  baseUrl: string;
  apiKey: string;
  headers: () => Record<string, string>;
  path: string;
  query?: Record<string, QueryValue>;
  tags: CacheTag[];
  ttl: number;
}

export async function requestJson<T = unknown>(opts: RequestJsonOptions): Promise<FetchResult<T>> {
  const missing: string[] = [];
  if (!opts.baseUrl) missing.push('baseUrl');
  if (!opts.apiKey) missing.push('apiKey');
  if (missing.length) return notConfiguredResult<T>(opts.service, opts.endpoint, missing);

  let url: URL;
  try {
    url = buildUrl(opts.baseUrl, opts.path, opts.query);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'invalid service url';
    return invalidUrlResult<T>(opts.service, opts.endpoint, message);
  }

  return fetchJson<T>({
    service: opts.service,
    endpoint: opts.endpoint,
    url,
    headers: opts.headers(),
    tags: opts.tags,
    ttl: opts.ttl,
  });
}
