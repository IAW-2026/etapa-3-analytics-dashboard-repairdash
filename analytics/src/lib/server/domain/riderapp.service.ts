import 'server-only';

import type { RiderAppData } from '@/lib/types';
import { fetchRiderAppSuperAdmin } from '../external/riderapp/client';
import { mapRiderAppData } from '../external/riderapp/mapper';

export async function getRiderApp(): Promise<RiderAppData> {
  return mapRiderAppData(await fetchRiderAppSuperAdmin());
}
