import 'server-only';

import { canRequest, recordCircuitFailure, recordCircuitSuccess } from './circuit-breaker';
import { logFinalFetchResult } from './logger';
import { recordFetchResult } from './metrics';
import type { FetchFailure, FetchFailureReason, FetchRequest, FetchResult } from './types';

const DEFAULT_TIMEOUT_MS = 5_000;
const DEFAULT_RETRIES = 1;
const RETRY_BASE_DELAY_MS = 150;

function traceId(): string {
  return `an_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function durationSince(start: number): number {
  return Math.max(0, Math.round(performance.now() - start));
}

function retryableHttpStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelay(): number {
  return RETRY_BASE_DELAY_MS + Math.floor(Math.random() * 75);
}

function failure(
  request: FetchRequest,
  reason: FetchFailureReason,
  start: number,
  attempts: number,
  id: string,
  retryable: boolean,
  status?: number,
  message?: string,
): FetchFailure {
  return {
    ok: false,
    reason,
    retryable,
    status,
    message,
    durationMs: durationSince(start),
    attempts,
    service: request.service,
    endpoint: request.endpoint,
    traceId: id,
  };
}

async function fetchAttempt<T>(
  request: FetchRequest,
  timeoutMs: number,
): Promise<{ ok: true; status: number; data: T } | { ok: false; reason: FetchFailureReason; status?: number; retryable: boolean; message?: string }> {
  const controller = new AbortController();
  let timedOut = false;
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch(request.url, {
      headers: request.headers,
      next: { revalidate: request.ttl, tags: request.tags },
      redirect: 'manual',
      signal: controller.signal,
    });

    if (!res.ok) {
      return {
        ok: false,
        reason: 'http',
        status: res.status,
        retryable: retryableHttpStatus(res.status),
        message: res.statusText,
      };
    }

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      return {
        ok: false,
        reason: 'non-json',
        status: res.status,
        retryable: false,
        message: contentType || 'missing content-type',
      };
    }

    try {
      return { ok: true, status: res.status, data: (await res.json()) as T };
    } catch (error) {
      return {
        ok: false,
        reason: 'parse',
        status: res.status,
        retryable: false,
        message: error instanceof Error ? error.message : 'invalid json',
      };
    }
  } catch (error) {
    return {
      ok: false,
      reason: timedOut ? 'timeout' : 'network',
      retryable: true,
      message: error instanceof Error ? error.message : 'fetch failed',
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function fetchJson<T = unknown>(request: FetchRequest): Promise<FetchResult<T>> {
  const id = traceId();
  const start = performance.now();
  const timeoutMs = request.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxAttempts = (request.retries ?? DEFAULT_RETRIES) + 1;

  if (!canRequest(request.service, request.endpoint)) {
    const result = failure(request, 'circuit-open', start, 0, id, true);
    recordFetchResult(result);
    logFinalFetchResult(result);
    return result;
  }

  let lastFailure: FetchFailure | null = null;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const result = await fetchAttempt<T>(request, timeoutMs);

    if (result.ok) {
      const success: FetchResult<T> = {
        ok: true,
        data: result.data,
        status: result.status,
        durationMs: durationSince(start),
        attempts: attempt,
        service: request.service,
        endpoint: request.endpoint,
        traceId: id,
      };
      recordCircuitSuccess(request.service, request.endpoint);
      recordFetchResult(success);
      return success;
    }

    lastFailure = failure(
      request,
      result.reason,
      start,
      attempt,
      id,
      result.retryable,
      result.status,
      result.message,
    );

    if (!result.retryable || attempt >= maxAttempts) break;
    await delay(retryDelay());
  }

  const finalFailure = lastFailure ?? failure(request, 'network', start, maxAttempts, id, true);
  recordCircuitFailure(finalFailure);
  recordFetchResult(finalFailure);
  logFinalFetchResult(finalFailure);
  return finalFailure;
}

export function notConfiguredResult<T>(
  service: FetchRequest['service'],
  endpoint: string,
  missing: string[],
): FetchResult<T> {
  const result: FetchFailure = {
    ok: false,
    reason: 'not-configured',
    retryable: false,
    durationMs: 0,
    attempts: 0,
    service,
    endpoint,
    traceId: traceId(),
    message: `missing ${missing.join(', ')}`,
  };
  recordFetchResult(result);
  logFinalFetchResult(result);
  return result;
}

export function invalidUrlResult<T>(
  service: FetchRequest['service'],
  endpoint: string,
  message: string,
): FetchResult<T> {
  const result: FetchFailure = {
    ok: false,
    reason: 'invalid-url',
    retryable: false,
    durationMs: 0,
    attempts: 0,
    service,
    endpoint,
    traceId: traceId(),
    message,
  };
  recordFetchResult(result);
  logFinalFetchResult(result);
  return result;
}
