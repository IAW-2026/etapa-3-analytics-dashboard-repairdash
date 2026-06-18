import 'server-only';

import type { PromocionesData } from '@/lib/types';
import { fetchPromotionsAnalytics } from '../external/promotions/client';
import { mapPromocionesData } from '../external/promotions/mapper';

export async function getPromociones(from: string, to: string): Promise<PromocionesData> {
  return mapPromocionesData(await fetchPromotionsAnalytics(from, to));
}
