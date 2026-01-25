
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';
import { LyncMOS } from '@/services/MOSAPI';
import { Trip } from '@/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const response = await runtime.executeSafe(async () => MOCK_DB.trips, []);
  return NextResponse.json(response);
}

export async function POST(req: NextRequest) {
  try {
    const { action, tripId, key } = await req.json();
    
    const result = await runtime.executeSafe(async () => {
      if (action === 'dispatch') {
        const dispatchRes = await LyncMOS.dispatch(key || 'mos_pk_admin_global_7734', tripId);
        if (dispatchRes.error) throw new Error(dispatchRes.error.message);
        return dispatchRes.data;
      }
      throw new Error("UNSUPPORTED_ACTION");
    }, null as unknown as Trip, { isWrite: true });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 });
  }
}
