import 'server-only';

import type { DriverData } from '@/lib/types';
import type { DriverClientResponses } from './client';
import { asRecord, dataOrNull, num } from '../../domain/parsing';

const service = 'driver' as const;

export const emptyDriverData: DriverData = {
  ok: false,
  workers: null,
  jobs: null,
  jobsFinalizados: null,
  serviceTypes: null,
};

export function mapDriverData(responses: DriverClientResponses): DriverData {
  const summary = asRecord(dataOrNull(responses.summary), { service, endpoint: 'summary', path: 'root', traceId: responses.summary.traceId });
  const finished = asRecord(dataOrNull(responses.finishedJobs), {
    service,
    endpoint: 'jobs-finalizados',
    path: 'root',
    traceId: responses.finishedJobs.traceId,
  });
  const data = asRecord(summary?.data, { service, endpoint: 'summary', path: 'data', traceId: responses.summary.traceId });
  const workers = asRecord(data?.workers, { service, endpoint: 'summary', path: 'data.workers', traceId: responses.summary.traceId });
  const jobs = asRecord(data?.jobs, { service, endpoint: 'summary', path: 'data.jobs', traceId: responses.summary.traceId });
  const serviceTypes = asRecord(data?.serviceTypes, { service, endpoint: 'summary', path: 'data.serviceTypes', traceId: responses.summary.traceId });
  const pagination = asRecord(finished?.pagination, {
    service,
    endpoint: 'jobs-finalizados',
    path: 'pagination',
    traceId: responses.finishedJobs.traceId,
  });

  return {
    ok: responses.summary.ok,
    workers: workers
      ? {
          total: num(workers.total, { service, endpoint: 'summary', path: 'workers.total' }),
          online: num(workers.online, { service, endpoint: 'summary', path: 'workers.online' }),
          enTrabajo: num(workers.enTrabajo, { service, endpoint: 'summary', path: 'workers.enTrabajo' }),
        }
      : null,
    jobs: jobs
      ? {
          activos: num(jobs.activos, { service, endpoint: 'summary', path: 'jobs.activos' }),
          pendientes: num(jobs.pendientes, { service, endpoint: 'summary', path: 'jobs.pendientes' }),
        }
      : null,
    jobsFinalizados: pagination ? num(pagination.total, { service, endpoint: 'jobs-finalizados', path: 'pagination.total' }) : null,
    serviceTypes: serviceTypes ? { total: num(serviceTypes.total, { service, endpoint: 'summary', path: 'serviceTypes.total' }) } : null,
  };
}
