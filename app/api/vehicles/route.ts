
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';
// Import MOSService to handle vehicle creation
import { MOSService } from '@/services/mosService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await runtime.executeSafe(async () => MOCK_DB.vehicles, []);
  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await runtime.executeSafe(async () => {
      // Use MOSService.addVehicle instead of non-existent runtime.createVehicle
      return await MOSService.addVehicle(body);
    }, null, { isWrite: true });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }
}
