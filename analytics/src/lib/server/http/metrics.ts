import 'server-only';

import type { FetchFailureReason, FetchResult, ServiceName } from './types';

interface EndpointMetrics {
  successes: number;
  failures: number;
  circuitOpen: number;
  mappingIssues: number;
  latencyTotalMs: number;
  requests: number;
  failureReasons: Partial<Record<FetchFailureReason, number>>;
}

const metrics = new Map<string, EndpointMetrics>();

function key(service: ServiceName, endpoint: string): string {
  return `${service}:${endpoint}`;
}

function bucket(service: ServiceName, endpoint: string): EndpointMetrics {
  const k = key(service, endpoint);
  const current = metrics.get(k);
  if (current) return current;

  const next: EndpointMetrics = {
    successes: 0,
    failures: 0,
    circuitOpen: 0,
    mappingIssues: 0,
    latencyTotalMs: 0,
    requests: 0,
    failureReasons: {},
  };
  metrics.set(k, next);
  return next;
}

export function recordFetchResult<T>(result: FetchResult<T>): void {
  const b = bucket(result.service, result.endpoint);
  b.requests += 1;
  b.latencyTotalMs += result.durationMs;

  if (result.ok) {
    b.successes += 1;
    return;
  }

  b.failures += 1;
  b.failureReasons[result.reason] = (b.failureReasons[result.reason] ?? 0) + 1;
  if (result.reason === 'circuit-open') b.circuitOpen += 1;
}

export function recordMappingIssue(service: ServiceName, endpoint: string): void {
  bucket(service, endpoint).mappingIssues += 1;
}

export function getMetricsSnapshot(): Record<string, EndpointMetrics> {
  return Object.fromEntries(
    [...metrics.entries()].map(([k, v]) => [k, { ...v, failureReasons: { ...v.failureReasons } }]),
  );
}

export function resetMetricsForTests(): void {
  metrics.clear();
}
