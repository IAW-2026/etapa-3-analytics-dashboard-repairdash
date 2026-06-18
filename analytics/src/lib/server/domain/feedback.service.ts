import 'server-only';

import type { FeedbackData } from '@/lib/types';
import { fetchFeedbackAnalytics } from '../external/feedback/client';
import { mapFeedbackData } from '../external/feedback/mapper';

export async function getFeedback(month: string): Promise<FeedbackData> {
  return mapFeedbackData(await fetchFeedbackAnalytics(month));
}
