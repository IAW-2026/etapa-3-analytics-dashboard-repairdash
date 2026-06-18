import 'server-only';

import type { DriverData } from '@/lib/types';
import { fetchDriverControlPlane } from '../external/driver/client';
import { mapDriverData } from '../external/driver/mapper';

export async function getDriver(): Promise<DriverData> {
  return mapDriverData(await fetchDriverControlPlane());
}
