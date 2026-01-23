
import { NextRequest, NextResponse } from 'next/server';
import { MOSService } from '@/services/mosService';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';
import { TripStatus } from '@/types';

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
    
    const result = await runtime.executeSafe(async () => {
      if (action === 'dispatch') return await MOSService.updateTripStatus(tripId, TripStatus.ACTIVE);
      if (action === 'update_status') return await MOSService.updateTripStatus(tripId, status);
      throw new Error("UNSUPPORTED_ACTION");
    }, null as any, { isWrite: true });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err.message || 'Payload processing fault.'
    }, { status: 400 });
  }
}
