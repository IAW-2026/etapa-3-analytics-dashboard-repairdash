import 'server-only';

import { logMapperIssue } from '../http/logger';
import type { FetchResult, ServiceName } from '../http/types';

interface ParseContext {
  service: ServiceName;
  endpoint: string;
  path: string;
  traceId?: string;
}

function issue(ctx: ParseContext, message: string): void {
  logMapperIssue(ctx.service, ctx.endpoint, `${ctx.path}: ${message}`, ctx.traceId);
}

export function dataOrNull(result: FetchResult<unknown>): unknown | null {
  return result.ok ? result.data : null;
}

export function asRecord(value: unknown, ctx: ParseContext): Record<string, unknown> | null {
  if (value == null) return null;
  if (typeof value === 'object' && !Array.isArray(value)) return value as Record<string, unknown>;
  issue(ctx, 'expected object');
  return null;
}

export function asRecordArray(value: unknown, ctx: ParseContext): Record<string, unknown>[] {
  if (value == null) return [];
  if (!Array.isArray(value)) {
    issue(ctx, 'expected array');
    return [];
  }

  const out: Record<string, unknown>[] = [];
  value.forEach((item, index) => {
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      out.push(item as Record<string, unknown>);
    } else {
      issue({ ...ctx, path: `${ctx.path}[${index}]` }, 'expected object item');
    }
  });
  return out;
}

export function num(value: unknown, ctx?: ParseContext): number | null {
  if (value == null) return null;
  const n = typeof value === 'number' ? value : parseFloat(String(value));
  if (Number.isFinite(n)) return n;
  if (ctx) issue(ctx, 'expected number');
  return null;
}

export function recordOfNumbers(value: unknown, ctx: ParseContext): Record<string, number> | null {
  const source = asRecord(value, ctx);
  if (!source) return null;

  const out: Record<string, number> = {};
  for (const [key, val] of Object.entries(source)) {
    const n = num(val, { ...ctx, path: `${ctx.path}.${key}` });
    if (n != null) out[key] = n;
  }
  return out;
}
