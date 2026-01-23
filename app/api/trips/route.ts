
import { NextRequest, NextResponse } from 'next/server';
import { MOSService } from '@/services/mosService';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';
import { TripStatus } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await runtime.executeSafe(async () => {
    return MOCK_DB.trips || [];
  }, []);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tripId, status } = body;
    
    if (!action || !tripId) {
      return NextResponse.json({ error: 'Missing "action" or "tripId"' }, { status: 400 });
    }

    const result = await runtime.executeSafe(async () => {
      if (action === 'dispatch') return await MOSService.updateTripStatus(tripId, TripStatus.ACTIVE);
      if (action === 'update_status') return await MOSService.updateTripStatus(tripId, status);
      throw new Error("UNSUPPORTED_ACTION");
    }, null as any, { isWrite: true });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'Operation failed' }, { status: 400 });
  }
}
