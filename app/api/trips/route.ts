
import { NextRequest, NextResponse } from 'next/server';
import { MOSService } from '@/services/mosService';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/services/coreRuntime';
import { TripStatus } from '@/types';

export async function GET() {
  const result = await runtime.executeSafe(async () => MOCK_DB.trips, []);
  return NextResponse.json({
    status: result.error ? 'error' : 'success',
    data: result.data,
    fallback: !!result.error
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tripId, status } = body;
    
    const result = await runtime.executeSafe(async () => {
      if (action === 'dispatch') return await MOSService.updateTripStatus(tripId, TripStatus.ACTIVE);
      if (action === 'update_status') return await MOSService.updateTripStatus(tripId, status);
      throw new Error("INVALID_ACTION");
    }, null as any, { isWrite: true });

    return NextResponse.json({
      status: result.error ? 'error' : 'success',
      data: result.data,
      fallback: !!result.error,
      error: result.error
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'error',
      message: err.message
    }, { status: 400 });
  }
}
