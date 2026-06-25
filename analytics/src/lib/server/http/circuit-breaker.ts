import 'server-only';

import { logCircuitTransition } from './logger';
import type { FetchFailure, ServiceName } from './types';

type CircuitState = 'closed' | 'open' | 'half-open';

interface CircuitBucket {
  state: CircuitState;
  failures: number;
  openedAt: number;
}

const FAILURE_THRESHOLD = 3;
const COOLDOWN_MS = 30_000;
const circuits = new Map<string, CircuitBucket>();

function key(service: ServiceName, endpoint: string): string {
  return `${service}:${endpoint}`;
}

function bucket(service: ServiceName, endpoint: string): CircuitBucket {
  const k = key(service, endpoint);
  const current = circuits.get(k);
  if (current) return current;

  const next: CircuitBucket = { state: 'closed', failures: 0, openedAt: 0 };
  circuits.set(k, next);
  return next;
}

export function canRequest(service: ServiceName, endpoint: string, now = Date.now()): boolean {
  const c = bucket(service, endpoint);
  if (c.state !== 'open') return true;

  if (now - c.openedAt >= COOLDOWN_MS) {
    c.state = 'half-open';
    logCircuitTransition(service, endpoint, 'half-open');
    return true;
  }

  return false;
}

export function recordCircuitSuccess(service: ServiceName, endpoint: string): void {
  const c = bucket(service, endpoint);
  if (c.state !== 'closed' || c.failures > 0) {
    c.state = 'closed';
    c.failures = 0;
    c.openedAt = 0;
    logCircuitTransition(service, endpoint, 'closed');
  }
}

export function recordCircuitFailure(result: FetchFailure, now = Date.now()): void {
  if (!result.retryable) return;

  const c = bucket(result.service, result.endpoint);
  c.failures = c.state === 'half-open' ? FAILURE_THRESHOLD : c.failures + 1;

  if (c.failures >= FAILURE_THRESHOLD) {
    c.state = 'open';
    c.openedAt = now;
    logCircuitTransition(result.service, result.endpoint, 'open');
  }
}

export function resetCircuitsForTests(): void {
  circuits.clear();
}
