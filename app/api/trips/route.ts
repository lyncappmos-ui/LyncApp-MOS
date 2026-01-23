
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';
import { LyncMOS } from '@/services/MOSAPI';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await runtime.executeSafe(async () => MOCK_DB.trips, []);
  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, tripId, key } = body;
    
    const result = await runtime.executeSafe(async () => {
      if (action === 'dispatch') return await LyncMOS.dispatch(key || 'mos_pk_admin_global_7734', tripId);
      throw new Error("UNSUPPORTED_ACTION");
    }, null, { isWrite: true });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }
}
