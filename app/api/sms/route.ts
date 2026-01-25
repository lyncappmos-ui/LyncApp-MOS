
import { NextRequest, NextResponse } from 'next/server';
import { runtime } from '@/core/coreRuntime';

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    const result = await runtime.executeSafe(async () => {
      // Mock SMS delivery relay
      console.log(`[MOS_SMS_GATEWAY] Dispatching to ${phone}: ${message}`);
      return { success: true, trackingId: `SMS_${Math.random().toString(36).substring(7).toUpperCase()}` };
    }, { success: false, trackingId: 'FALLBACK' }, { isWrite: true });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
  }
}
