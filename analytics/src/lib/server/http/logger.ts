import 'server-only';

import { recordMappingIssue } from './metrics';
import type { FetchFailure, FetchResult, ServiceName } from './types';

type LogLevel = 'warn' | 'error';

interface LogPayload {
  event: string;
  service: ServiceName;
  endpoint: string;
  traceId?: string;
  status?: number;
  reason?: string;
  retryable?: boolean;
  attempts?: number;
  durationMs?: number;
  message?: string;
}

function write(level: LogLevel, payload: LogPayload): void {
  const clean = Object.fromEntries(
    Object.entries(payload).filter(([, value]) => value !== undefined && value !== ''),
  );
  const line = JSON.stringify({ source: 'analytics-dashboard', ...clean });
  if (level === 'error') console.error(line);
  else console.warn(line);
}

export function logFetchFailure(result: FetchFailure): void {
  write(result.retryable ? 'error' : 'warn', {
    event: 'external-fetch-failed',
    service: result.service,
    endpoint: result.endpoint,
    traceId: result.traceId,
    status: result.status,
    reason: result.reason,
    retryable: result.retryable,
    attempts: result.attempts,
    durationMs: result.durationMs,
    message: result.message,
  });
}

export function logCircuitTransition(
  service: ServiceName,
  endpoint: string,
  state: 'open' | 'half-open' | 'closed',
): void {
  write('warn', {
    event: 'external-circuit-transition',
    service,
    endpoint,
    reason: state,
  });
}

export function logMapperIssue(
  service: ServiceName,
  endpoint: string,
  message: string,
  traceId?: string,
): void {
  recordMappingIssue(service, endpoint);
  write('warn', {
    event: 'external-payload-invalid',
    service,
    endpoint,
    traceId,
    reason: 'parse',
    message,
  });
}

export function logFinalFetchResult<T>(result: FetchResult<T>): void {
  if (!result.ok) logFetchFailure(result);
}
