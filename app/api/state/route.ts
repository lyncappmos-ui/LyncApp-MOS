
import { NextRequest, NextResponse } from 'next/server';
import { LyncMOS } from '@/services/MOSAPI';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const phone = req.nextUrl.searchParams.get('phone') || "254700000004";
  const response = await LyncMOS.getTerminalContext(phone);
  return NextResponse.json(response);
}
