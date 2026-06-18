import 'server-only';

import type { CacheTag } from '../cache';

export type ServiceName = 'payments' | 'driver' | 'riderapp' | 'feedback' | 'promotions';

export type FetchFailureReason =
  | 'not-configured'
  | 'invalid-url'
  | 'circuit-open'
  | 'timeout'
  | 'network'
  | 'http'
  | 'non-json'
  | 'parse';

export interface FetchRequest {
  service: ServiceName;
  endpoint: string;
  url: URL;
  headers: Record<string, string>;
  tags: CacheTag[];
  ttl: number;
  timeoutMs?: number;
  retries?: number;
}

export interface FetchSuccess<T> {
  ok: true;
  data: T;
  status: number;
  durationMs: number;
  attempts: number;
  service: ServiceName;
  endpoint: string;
  traceId: string;
}

export interface FetchFailure {
  ok: false;
  reason: FetchFailureReason;
  retryable: boolean;
  durationMs: number;
  attempts: number;
  service: ServiceName;
  endpoint: string;
  traceId: string;
  status?: number;
  message?: string;
}

export type FetchResult<T> = FetchSuccess<T> | FetchFailure;
