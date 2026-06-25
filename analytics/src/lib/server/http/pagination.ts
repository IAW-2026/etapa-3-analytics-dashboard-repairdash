import 'server-only';

import { logMapperIssue } from './logger';
import type { FetchResult, ServiceName } from './types';

interface PaginateOptions<I> {
  service: ServiceName;
  endpoint: string;
  requestPage: (page: number) => Promise<FetchResult<unknown>>;
  extractItems: (json: unknown) => I[];
  extractTotalPages: (json: unknown) => number;
  maxPages?: number;
}

export interface PaginateResult<I> {
  items: I[];
  truncated: boolean;
  totalPages: number;
}

export async function paginate<I>(opts: PaginateOptions<I>): Promise<PaginateResult<I>> {
  const { service, endpoint, requestPage, extractItems, extractTotalPages, maxPages = 40 } = opts;

  const first = await requestPage(1);
  if (!first.ok) return { items: [], truncated: false, totalPages: 0 };

  const totalPages = Math.max(1, extractTotalPages(first.data) || 1);
  const items: I[] = [...extractItems(first.data)];
  const lastPage = Math.min(totalPages, maxPages);

  if (lastPage > 1) {
    const pages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(pages.map((page) => requestPage(page)));
    for (const page of rest) {
      if (page.ok) {
        items.push(...extractItems(page.data));
      } else {
        logMapperIssue(service, endpoint, `pagination page failed: ${page.reason}`, page.traceId);
      }
    }
  }

  return { items, truncated: totalPages > maxPages, totalPages };
}
