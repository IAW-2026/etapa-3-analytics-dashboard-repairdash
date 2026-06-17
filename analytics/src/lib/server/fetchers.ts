import { CACHE_TTL, type CacheTag } from './cache';

// Reusa el patrón tolerante a fallos del Control Plane: cualquier error de red,
// status != 2xx o respuesta no-JSON (p.ej. una página de login HTML) devuelve
// null en vez de romper. Así, si un servicio está caído, el resto del dashboard
// sigue renderizando.
export async function safeFetch<T = unknown>(
  url: string,
  headers: Record<string, string>,
  tags: CacheTag[],
  ttl: number = CACHE_TTL.overview,
): Promise<T | null> {
  try {
    const res = await fetch(url, {
      headers,
      next: { revalidate: ttl, tags },
      redirect: 'manual',
    });
    if (!res.ok) return null;
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) return null; // p.ej. una página de login HTML
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface PaginateOptions<I> {
  // Construye la URL para una página dada (base 1).
  buildUrl: (page: number) => string;
  headers: Record<string, string>;
  tags: CacheTag[];
  ttl?: number;
  // Extrae el array de items y el total de páginas de cada respuesta.
  extractItems: (json: unknown) => I[];
  extractTotalPages: (json: unknown) => number;
  // Tope defensivo para no recorrer datasets enormes en cada request.
  maxPages?: number;
}

export interface PaginateResult<I> {
  items: I[];
  truncated: boolean; // true si había más páginas de las que trajimos
  totalPages: number;
}

// Recorre un endpoint paginado acumulando items. Trae la página 1, lee el total
// de páginas y luego pide el resto en paralelo (hasta `maxPages`). Si el dataset
// excede el tope, marca `truncated` para que la UI pueda avisarlo.
export async function paginate<I>(opts: PaginateOptions<I>): Promise<PaginateResult<I>> {
  const { buildUrl, headers, tags, ttl = CACHE_TTL.service, extractItems, extractTotalPages, maxPages = 40 } = opts;

  const first = await safeFetch(buildUrl(1), headers, tags, ttl);
  if (first == null) return { items: [], truncated: false, totalPages: 0 };

  const totalPages = Math.max(1, extractTotalPages(first) || 1);
  const items: I[] = [...extractItems(first)];

  const lastPage = Math.min(totalPages, maxPages);
  if (lastPage > 1) {
    const pages = Array.from({ length: lastPage - 1 }, (_, i) => i + 2);
    const rest = await Promise.all(pages.map(p => safeFetch(buildUrl(p), headers, tags, ttl)));
    for (const json of rest) {
      if (json != null) items.push(...extractItems(json));
    }
  }

  return { items, truncated: totalPages > maxPages, totalPages };
}
