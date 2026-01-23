
import { NextResponse } from 'next/server';
import { runtime } from '@/core/coreRuntime';

export async function GET() {
  const state = runtime.getState();
  return NextResponse.json({
    status: 'MOS Core Operational',
    coreState: state,
    uptime: `${Math.floor(runtime.getUptime())}s`,
    timestamp: new Date().toISOString(),
    node: (process as any).version || '24.x'
  });
}
