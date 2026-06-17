// TTLs (segundos) y tags de revalidación por servicio. Los dashboards de
// analítica toleran datos ligeramente diferidos: cacheamos las respuestas
// upstream unos segundos para no martillar las APIs en cada navegación.
export const CACHE_TTL = {
  overview: 30,
  service: 30,
} as const;

export const CACHE_TAGS = {
  overview:   'an:overview',
  riderapp:   'an:riderapp',
  driver:     'an:driver',
  payments:   'an:payments',
  feedback:   'an:feedback',
  promociones:'an:promociones',
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];
