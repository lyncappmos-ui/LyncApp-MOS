
import { NextResponse } from 'next/server';
import { MetricsService } from '@/services/metricsService';
import { runtime } from '@/core/coreRuntime';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await runtime.executeSafe(async () => {
    return MetricsService.getPlatformOperations();
  }, {
    activeTripCount: 0,
    globalTicketVolume: 0,
    systemLoadFactor: 0,
    lastAnchorTimestamp: new Date().toISOString()
  });

  return NextResponse.json(result);
}
