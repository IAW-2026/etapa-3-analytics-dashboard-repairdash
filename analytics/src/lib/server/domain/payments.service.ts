import 'server-only';

import type { PaymentsData } from '@/lib/types';
import { fetchPaymentsAnalytics } from '../external/payments/client';
import { mapPaymentsData } from '../external/payments/mapper';

export async function getPayments(month: string, days: number, range?: { from: string; to: string }): Promise<PaymentsData> {
  return mapPaymentsData(await fetchPaymentsAnalytics(month, days), range);
}
