import 'server-only';

import { CACHE_TAGS, CACHE_TTL } from '../../cache';
import { ENV, promoHeaders } from '../../config';
import { paginate, type PaginateResult } from '../../http/pagination';
import type { FetchResult } from '../../http/types';
import { requestJson } from '../request';

const service = 'promotions' as const;
const tags = [CACHE_TAGS.promociones];

function request(endpoint: string, path: string, query?: Record<string, string | number>): Promise<FetchResult<unknown>> {
  return requestJson({
    service,
    endpoint,
    baseUrl: ENV.promociones.base,
    apiKey: ENV.promociones.key,
    headers: promoHeaders,
    path,
    query,
    tags,
    ttl: CACHE_TTL.service,
  });
}

function itemsFromPayload(json: unknown): Record<string, unknown>[] {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return [];
  const data = (json as Record<string, unknown>).data;
  if (!Array.isArray(data)) return [];
  return data.filter((item): item is Record<string, unknown> => !!item && typeof item === 'object' && !Array.isArray(item));
}

function totalPagesFromPayload(json: unknown): number {
  if (!json || typeof json !== 'object' || Array.isArray(json)) return 1;
  const pagination = (json as Record<string, unknown>).pagination;
  if (!pagination || typeof pagination !== 'object' || Array.isArray(pagination)) return 1;
  const totalPages = Number((pagination as Record<string, unknown>).totalPages);
  return Number.isFinite(totalPages) ? totalPages : 1;
}

export interface PromotionsClientResponses {
  vigentes: FetchResult<unknown>;
  programadas: FetchResult<unknown>;
  vencidas: FetchResult<unknown>;
  eliminadas: FetchResult<unknown>;
  historialCount: FetchResult<unknown>;
  historial: PaginateResult<Record<string, unknown>>;
}

export async function fetchPromotionsAnalytics(from: string, to: string): Promise<PromotionsClientResponses> {
  const [vigentes, programadas, vencidas, eliminadas, historialCount, historial] = await Promise.all([
    request('count-vigentes', '/api/admin/promociones/count', { estado: 'vigentes' }),
    request('count-programadas', '/api/admin/promociones/count', { estado: 'programadas' }),
    request('count-vencidas', '/api/admin/promociones/count', { estado: 'vencidas' }),
    request('count-eliminadas', '/api/admin/promociones/count', { estado: 'eliminadas' }),
    request('historial-count', '/api/historial/count', { desde: from, hasta: to }),
    paginate<Record<string, unknown>>({
      service,
      endpoint: 'historial',
      requestPage: (page) => request('historial', '/api/historial', { desde: from, hasta: to, limit: 100, page }),
      extractItems: itemsFromPayload,
      extractTotalPages: totalPagesFromPayload,
    }),
  ]);

  return { vigentes, programadas, vencidas, eliminadas, historialCount, historial };
}
