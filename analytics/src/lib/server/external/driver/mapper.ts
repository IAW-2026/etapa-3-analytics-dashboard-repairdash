import 'server-only';

import type { DriverData, DriverServiceTypeMetric, DriverTimeseriesPoint } from '@/lib/types';
import type { DriverClientResponses } from './client';
import { asRecord, asRecordArray, dataOrNull, num } from '../../domain/parsing';
import { logMapperIssue } from '../../http/logger';

const service = 'driver' as const;
const noDataMessage = 'No hay datos disponibles para ese rango';

export const emptyDriverData: DriverData = {
  ok: false,
  message: noDataMessage,
  workers: { total: null, online: 0, enTrabajo: null },
  jobs: { activos: 0, pendientes: null, creados: 0, finalizados: 0, cancelados: 0 },
  jobsFinalizados: 0,
  serviceTypes: { total: 0, items: [] },
  jobsTimeseries: [],
};

const CREATED_KEYS = ['jobsCreated', 'createdJobs', 'created', 'creados', 'trabajosCreados', 'totalCreated', 'totalJobs', 'jobs', 'count', 'total'];
const FINISHED_KEYS = ['jobsFinished', 'finishedJobs', 'completedJobs', 'finalizedJobs', 'finalizados', 'trabajosFinalizados', 'completed', 'finished', 'done'];
const CANCELLED_KEYS = ['jobsCancelled', 'cancelledJobs', 'canceledJobs', 'cancelled', 'canceled', 'cancelados', 'trabajosCancelados'];
const ACTIVE_KEYS = ['jobsActive', 'activeJobs', 'active', 'activos', 'inProgress', 'enCurso', 'enTrabajo'];
const PENDING_KEYS = ['jobsPending', 'pendingJobs', 'pending', 'pendientes'];
const ONLINE_KEYS = ['driversOnline', 'onlineDrivers', 'workersOnline', 'online', 'conductoresOnline', 'trabajadoresOnline'];
const TOTAL_WORKERS_KEYS = ['driversTotal', 'totalDrivers', 'workersTotal', 'totalWorkers', 'total'];
const BUSY_WORKERS_KEYS = ['driversBusy', 'busyDrivers', 'workersBusy', 'enTrabajo', 'busy'];
const SERVICE_TYPE_KEYS = ['serviceType', 'type', 'name', 'nombre', 'category', 'rubro'];
const AVG_MINUTES_KEYS = ['averageMinutes', 'avgMinutes', 'averageCompletionMinutes', 'avgDurationMinutes', 'averageCompletionTimeMinutes', 'averageCompletionTime', 'avgDuration'];

function mapperIssue(endpoint: string, path: string, message: string, traceId?: string): void {
  logMapperIssue(service, endpoint, `${path}: ${message}`, traceId);
}

function payload(result: DriverClientResponses[keyof DriverClientResponses], endpoint: string): unknown {
  const raw = dataOrNull(result);
  if (Array.isArray(raw)) return raw;
  const root = asRecord(raw, { service, endpoint, path: 'root', traceId: result.traceId });
  if (!root) return null;
  return root.data ?? root;
}

function objectPayload(result: DriverClientResponses[keyof DriverClientResponses], endpoint: string): Record<string, unknown> | null {
  const source = payload(result, endpoint);
  return asRecord(source, { service, endpoint, path: 'payload', traceId: result.traceId });
}

function arrayPayload(result: DriverClientResponses[keyof DriverClientResponses], endpoint: string): Record<string, unknown>[] {
  const source = payload(result, endpoint);
  if (Array.isArray(source)) {
    return asRecordArray(source, { service, endpoint, path: 'payload', traceId: result.traceId });
  }

  const root = asRecord(source, { service, endpoint, path: 'payload', traceId: result.traceId });
  if (!root) return [];

  for (const key of ['items', 'series', 'buckets', 'days', 'timeseries', 'serviceTypes', 'data']) {
    if (Array.isArray(root[key])) {
      return asRecordArray(root[key], { service, endpoint, path: `payload.${key}`, traceId: result.traceId });
    }
  }

  return [];
}

function pickRecord(
  source: Record<string, unknown> | null,
  keys: string[],
  endpoint: string,
  path: string,
  traceId?: string,
): Record<string, unknown> | null {
  if (!source) return null;
  for (const key of keys) {
    if (source[key] != null) {
      return asRecord(source[key], { service, endpoint, path: `${path}.${key}`, traceId });
    }
  }
  return null;
}

function pickNumber(
  source: Record<string, unknown> | null,
  keys: string[],
  endpoint: string,
  path: string,
  traceId?: string,
): number | null {
  if (!source) return null;
  for (const key of keys) {
    if (source[key] != null) {
      return num(source[key], { service, endpoint, path: `${path}.${key}`, traceId });
    }
  }
  return null;
}

function pickText(source: Record<string, unknown>, keys: string[]): string | null {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return null;
}

function pickDate(source: Record<string, unknown>, endpoint: string, path: string, traceId?: string): string | null {
  const value = pickText(source, ['date', 'day', 'bucket', 'fecha']);
  if (!value) {
    mapperIssue(endpoint, path, 'missing date', traceId);
    return null;
  }
  const ymd = value.slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) {
    mapperIssue(endpoint, path, 'invalid date', traceId);
    return null;
  }
  return ymd;
}

function mapTimeseries(responses: DriverClientResponses): DriverTimeseriesPoint[] {
  return arrayPayload(responses.jobsTimeseries, 'jobs-timeseries')
    .map((item, index) => {
      const traceId = responses.jobsTimeseries.traceId;
      const date = pickDate(item, 'jobs-timeseries', `payload[${index}]`, traceId);
      const metrics = pickRecord(item, ['jobs', 'trabajos', 'counts', 'metrics'], 'jobs-timeseries', `payload[${index}]`, traceId) ?? item;
      if (!date) return null;
      return {
        date,
        created: pickNumber(metrics, CREATED_KEYS, 'jobs-timeseries', `payload[${index}]`, traceId) ?? 0,
        finished: pickNumber(metrics, FINISHED_KEYS, 'jobs-timeseries', `payload[${index}]`, traceId) ?? 0,
        cancelled: pickNumber(metrics, CANCELLED_KEYS, 'jobs-timeseries', `payload[${index}]`, traceId) ?? 0,
      };
    })
    .filter((point): point is DriverTimeseriesPoint => point != null);
}

function mapServiceTypes(responses: DriverClientResponses): DriverServiceTypeMetric[] {
  return arrayPayload(responses.serviceTypes, 'service-types').map((item, index) => {
    const traceId = responses.serviceTypes.traceId;
    const metrics = pickRecord(item, ['jobs', 'trabajos', 'counts', 'metrics'], 'service-types', `payload[${index}]`, traceId) ?? item;
    const name = pickText(item, SERVICE_TYPE_KEYS) || `Tipo ${index + 1}`;
    return {
      name,
      created: pickNumber(metrics, CREATED_KEYS, 'service-types', `payload[${index}]`, traceId) ?? 0,
      finished: pickNumber(metrics, FINISHED_KEYS, 'service-types', `payload[${index}]`, traceId) ?? 0,
      cancelled: pickNumber(metrics, CANCELLED_KEYS, 'service-types', `payload[${index}]`, traceId) ?? 0,
      active: pickNumber(metrics, ACTIVE_KEYS, 'service-types', `payload[${index}]`, traceId),
      averageMinutes: pickNumber(metrics, AVG_MINUTES_KEYS, 'service-types', `payload[${index}]`, traceId),
    };
  });
}

export function mapDriverData(responses: DriverClientResponses): DriverData {
  const summary = objectPayload(responses.summary, 'summary');
  const workers = pickRecord(summary, ['workers', 'drivers', 'trabajadores'], 'summary', 'payload', responses.summary.traceId) ?? summary;
  const jobs = pickRecord(summary, ['jobs', 'trabajos', 'metrics', 'kpis'], 'summary', 'payload', responses.summary.traceId) ?? summary;
  const serviceTypesSummary = pickRecord(summary, ['serviceTypes', 'tiposServicio'], 'summary', 'payload', responses.summary.traceId) ?? summary;

  const created = pickNumber(jobs, CREATED_KEYS, 'summary', 'jobs', responses.summary.traceId) ?? 0;
  const finished = pickNumber(jobs, FINISHED_KEYS, 'summary', 'jobs', responses.summary.traceId) ?? 0;
  const cancelled = pickNumber(jobs, CANCELLED_KEYS, 'summary', 'jobs', responses.summary.traceId) ?? 0;
  const timeseries = mapTimeseries(responses);
  const serviceTypes = mapServiceTypes(responses);

  return {
    ok: responses.summary.ok || responses.jobsTimeseries.ok || responses.serviceTypes.ok,
    workers: {
      total: pickNumber(workers, TOTAL_WORKERS_KEYS, 'summary', 'workers', responses.summary.traceId),
      online: pickNumber(workers, ONLINE_KEYS, 'summary', 'workers', responses.summary.traceId) ?? 0,
      enTrabajo: pickNumber(workers, BUSY_WORKERS_KEYS, 'summary', 'workers', responses.summary.traceId),
    },
    jobs: {
      activos: pickNumber(jobs, ACTIVE_KEYS, 'summary', 'jobs', responses.summary.traceId) ?? created,
      pendientes: pickNumber(jobs, PENDING_KEYS, 'summary', 'jobs', responses.summary.traceId),
      creados: created,
      finalizados: finished,
      cancelados: cancelled,
    },
    jobsFinalizados: finished,
    serviceTypes: {
      total: pickNumber(serviceTypesSummary, ['total', 'count', 'totalServiceTypes'], 'summary', 'serviceTypes', responses.summary.traceId) ?? serviceTypes.length,
      items: serviceTypes,
    },
    jobsTimeseries: timeseries,
  };
}
