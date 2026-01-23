
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';

export async function GET() {
  const result = await runtime.executeSafe(async () => {
    return MOCK_DB.vehicles || [];
  }, []);

  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || (!body.plateNumber && !body.plate)) {
      return NextResponse.json({ error: 'Invalid payload: "plateNumber" is required.' }, { status: 400 });
    }

    const result = await runtime.executeSafe(async () => {
      return await runtime.createVehicle(body);
    }, null as any, { isWrite: true });

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Payload processing fault.', message: err.message }, { status: 400 });
  }
}
