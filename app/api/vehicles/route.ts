
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await runtime.executeSafe(async () => MOCK_DB.vehicles, []);
  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = await runtime.executeSafe(async () => {
      return await runtime.createVehicle(body);
    }, null, { isWrite: true });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }
}
