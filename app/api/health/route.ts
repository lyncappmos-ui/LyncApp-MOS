
import { NextResponse } from 'next/server';
import { runtime } from '@/core/coreRuntime';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await runtime.executeSafe(async () => {
    return {
      status: 'MOS Core Operational',
      node: (process as any).version || '24.x',
      uptime: `${Math.floor(runtime.getUptime())}s`
    };
  }, { status: 'BOOTING', node: 'unknown', uptime: '0s' });

  return NextResponse.json(result);
}
