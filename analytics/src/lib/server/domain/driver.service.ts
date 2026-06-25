import 'server-only';

import { defaultDriverAnalyticsRange, DRIVER_ANALYTICS_EMPTY_MESSAGE, type DriverAnalyticsRange } from '@/lib/driver-analytics-period';
import type { DriverData } from '@/lib/types';
import { fetchDriverAnalytics } from '../external/driver/client';
import { emptyDriverData, mapDriverData } from '../external/driver/mapper';
import type { FetchResult } from '../http/types';

function neutralDriverData(overrides: Partial<DriverData> = {}): DriverData {
  return {
    ...emptyDriverData,
    ...overrides,
    workers: overrides.workers ?? (emptyDriverData.workers ? { ...emptyDriverData.workers } : null),
    jobs: overrides.jobs ?? (emptyDriverData.jobs ? { ...emptyDriverData.jobs } : null),
    serviceTypes: overrides.serviceTypes ?? (emptyDriverData.serviceTypes ? { ...emptyDriverData.serviceTypes, items: [...emptyDriverData.serviceTypes.items] } : null),
    jobsTimeseries: overrides.jobsTimeseries ?? [...emptyDriverData.jobsTimeseries],
  };
}

function isBadRequest(result: FetchResult<unknown>): boolean {
  return !result.ok && result.status === 400;
}

function isAuthOrServerFailure(result: FetchResult<unknown>): boolean {
  if (result.ok) return false;
  return result.status === 401 || result.status === 403 || (result.status != null && result.status >= 500);
}

function isCriticalIntegrationUnavailable(result: FetchResult<unknown>): boolean {
  if (result.ok) return false;
  return (
    result.reason === 'not-configured' ||
    result.reason === 'invalid-url' ||
    result.reason === 'non-json' ||
    result.reason === 'timeout' ||
    result.reason === 'network' ||
    result.reason === 'circuit-open' ||
    result.status === 401 ||
    result.status === 403 ||
    (result.status != null && result.status >= 500)
  );
}

export async function getDriver(range?: Pick<DriverAnalyticsRange, 'from' | 'to' | 'valid' | 'message'>): Promise<DriverData> {
  const resolved = range ?? defaultDriverAnalyticsRange();

  if (resolved.valid === false) {
    return neutralDriverData({
      ok: false,
      invalidRange: true,
      message: resolved.message ?? DRIVER_ANALYTICS_EMPTY_MESSAGE,
    });
  }

  const responses = await fetchDriverAnalytics({ from: resolved.from, to: resolved.to });
  const responseList = Object.values(responses);

  if (responseList.some(isBadRequest)) {
    return neutralDriverData({
      ok: false,
      invalidRange: true,
      message: DRIVER_ANALYTICS_EMPTY_MESSAGE,
    });
  }

  if (responseList.some(isAuthOrServerFailure) || isCriticalIntegrationUnavailable(responses.summary)) {
    return neutralDriverData({
      ok: false,
      unavailable: true,
      message: 'Integracion no disponible',
    });
  }

  return mapDriverData(responses);
}
