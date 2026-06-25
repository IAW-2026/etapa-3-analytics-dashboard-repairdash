import 'server-only';

// TTLs in seconds and revalidation tags per upstream service. Analytics data can
// tolerate a small delay, so service responses are cached briefly.
export const CACHE_TTL = {
  overview: 30,
  service: 30,
} as const;

export const CACHE_TAGS = {
  overview: 'an:overview',
  riderapp: 'an:riderapp',
  driver: 'an:driver',
  payments: 'an:payments',
  feedback: 'an:feedback',
  promociones: 'an:promociones',
} as const;

export type CacheTag = typeof CACHE_TAGS[keyof typeof CACHE_TAGS];
