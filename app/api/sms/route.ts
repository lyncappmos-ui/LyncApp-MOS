
import { NextRequest, NextResponse } from 'next/server';
import { runtime } from '@/core/coreRuntime';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { phone, message } = body;

    const result = await runtime.executeSafe(async () => {
      // Mock SMS Delivery Logic
      console.log(`[MOS_SMS_RELAY] Dispatching to ${phone}: ${message}`);
      return { success: true, ref: `SMS_${Math.random().toString(36).substring(7).toUpperCase()}` };
    }, { success: false, ref: 'FALLBACK' }, { isWrite: true });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: 'INVALID_PAYLOAD' }, { status: 400 });
  }
}
