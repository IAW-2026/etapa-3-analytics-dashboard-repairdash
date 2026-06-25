import 'server-only';

import type { PaymentsData } from '@/lib/types';
import type { PaymentsClientResponses } from './client';
import { asRecord, asRecordArray, dataOrNull, num } from '../../domain/parsing';

const service = 'payments' as const;

export const emptyPaymentsData: PaymentsData = {
  ok: false,
  gmv: null,
  paidTransactions: null,
  averageTicket: null,
  platformCommission: null,
  netToWorkers: null,
  failedTransactions: null,
  refundedTransactions: null,
  transactionsByStatus: null,
  amountByStatus: null,
  settlements: null,
  withdrawalsByStatus: null,
  revenueSeries: [],
};

interface PaymentsRange {
  from: string;
  to: string;
}

function withinRange(date: string, range?: PaymentsRange): boolean {
  return !range || (date >= range.from && date <= range.to);
}

export function mapPaymentsData(responses: PaymentsClientResponses, range?: PaymentsRange): PaymentsData {
  const summary = asRecord(dataOrNull(responses.summary), { service, endpoint: 'summary', path: 'root', traceId: responses.summary.traceId });
  const breakdown = asRecord(dataOrNull(responses.statusBreakdown), {
    service,
    endpoint: 'status-breakdown',
    path: 'root',
    traceId: responses.statusBreakdown.traceId,
  });
  const settlementsRes = asRecord(dataOrNull(responses.settlementsSummary), {
    service,
    endpoint: 'settlements-summary',
    path: 'root',
    traceId: responses.settlementsSummary.traceId,
  });
  const daily = asRecord(dataOrNull(responses.daily), { service, endpoint: 'daily', path: 'root', traceId: responses.daily.traceId });

  const kpis = asRecord(summary?.kpis, { service, endpoint: 'summary', path: 'kpis', traceId: responses.summary.traceId });
  const statuses = asRecordArray(breakdown?.statuses, {
    service,
    endpoint: 'status-breakdown',
    path: 'statuses',
    traceId: responses.statusBreakdown.traceId,
  });

  const transactionsByStatus = statuses.length ? {} as Record<string, number> : null;
  const amountByStatus = statuses.length ? {} as Record<string, number> : null;
  for (const status of statuses) {
    const key = typeof status.status === 'string' ? status.status : '';
    if (!key) continue;
    if (transactionsByStatus) transactionsByStatus[key] = num(status.count, { service, endpoint: 'status-breakdown', path: `${key}.count` }) ?? 0;
    if (amountByStatus) amountByStatus[key] = num(status.amount, { service, endpoint: 'status-breakdown', path: `${key}.amount` }) ?? 0;
  }

  const s = asRecord(settlementsRes?.settlements, {
    service,
    endpoint: 'settlements-summary',
    path: 'settlements',
    traceId: responses.settlementsSummary.traceId,
  });
  const settlements = s
    ? {
        liquidatedTransactions: num(s.liquidatedTransactions, { service, endpoint: 'settlements-summary', path: 'liquidatedTransactions' }),
        liquidatedGross: num(s.liquidatedGross, { service, endpoint: 'settlements-summary', path: 'liquidatedGross' }),
        commissionCollected: num(s.commissionCollected, { service, endpoint: 'settlements-summary', path: 'commissionCollected' }),
        netLiquidatedToWorkers: num(s.netLiquidatedToWorkers, { service, endpoint: 'settlements-summary', path: 'netLiquidatedToWorkers' }),
        withdrawalsRequested: num(s.withdrawalsRequested, { service, endpoint: 'settlements-summary', path: 'withdrawalsRequested' }),
        withdrawalsApproved: num(s.withdrawalsApproved, { service, endpoint: 'settlements-summary', path: 'withdrawalsApproved' }),
        withdrawalsRejected: num(s.withdrawalsRejected, { service, endpoint: 'settlements-summary', path: 'withdrawalsRejected' }),
        withdrawalsAmountApproved: num(s.withdrawalsAmountApproved, { service, endpoint: 'settlements-summary', path: 'withdrawalsAmountApproved' }),
      }
    : null;

  const withdrawalsByStatus = s
    ? {
        REQUESTED: num(s.withdrawalsRequested, { service, endpoint: 'settlements-summary', path: 'withdrawalsRequested' }) ?? 0,
        APPROVED: num(s.withdrawalsApproved, { service, endpoint: 'settlements-summary', path: 'withdrawalsApproved' }) ?? 0,
        REJECTED: num(s.withdrawalsRejected, { service, endpoint: 'settlements-summary', path: 'withdrawalsRejected' }) ?? 0,
      }
    : null;

  const buckets = asRecordArray(daily?.buckets, { service, endpoint: 'daily', path: 'buckets', traceId: responses.daily.traceId });
  const revenueSeries = buckets
    .map((bucket) => ({ date: typeof bucket.date === 'string' ? bucket.date : '', total: num(bucket.gmv, { service, endpoint: 'daily', path: 'gmv' }) ?? 0 }))
    .filter((bucket) => bucket.date && withinRange(bucket.date, range));

  return {
    ...emptyPaymentsData,
    ok: responses.summary.ok || responses.statusBreakdown.ok || responses.settlementsSummary.ok || responses.daily.ok,
    gmv: num(kpis?.gmv, { service, endpoint: 'summary', path: 'kpis.gmv' }),
    paidTransactions: num(kpis?.paidTransactions, { service, endpoint: 'summary', path: 'kpis.paidTransactions' }),
    averageTicket: num(kpis?.averageTicket, { service, endpoint: 'summary', path: 'kpis.averageTicket' }),
    platformCommission: num(kpis?.platformCommission, { service, endpoint: 'summary', path: 'kpis.platformCommission' }),
    netToWorkers: num(kpis?.netToWorkers, { service, endpoint: 'summary', path: 'kpis.netToWorkers' }),
    failedTransactions: num(kpis?.failedTransactions, { service, endpoint: 'summary', path: 'kpis.failedTransactions' }),
    refundedTransactions: num(kpis?.refundedTransactions, { service, endpoint: 'summary', path: 'kpis.refundedTransactions' }),
    transactionsByStatus,
    amountByStatus,
    settlements,
    withdrawalsByStatus,
    revenueSeries,
  };
}
