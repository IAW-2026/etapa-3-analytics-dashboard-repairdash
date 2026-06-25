import 'server-only';

import type { FeedbackData } from '@/lib/types';
import { fetchFeedbackAnalytics } from '../external/feedback/client';
import { mapFeedbackData } from '../external/feedback/mapper';
import { fetchDriverAnalytics } from '../external/driver/client';
import { mapDriverData } from '../external/driver/mapper';

export async function getFeedback(month: string, from: string, to: string): Promise<FeedbackData> {
  const [feedbackRes, driverRes] = await Promise.all([
    fetchFeedbackAnalytics(month, from, to),
    fetchDriverAnalytics({ from, to }),
  ]);

  const data = mapFeedbackData(feedbackRes);
  const driver = mapDriverData(driverRes);

  if (data.reportesDelMes != null && driver.jobs?.creados != null && driver.jobs.creados > 0) {
    data.tasaReportes = data.reportesDelMes / driver.jobs.creados;
  }

  return data;
}
