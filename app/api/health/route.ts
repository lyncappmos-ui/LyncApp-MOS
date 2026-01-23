
import { NextResponse } from 'next/server';
import { runtime } from '@/core/coreRuntime';

export async function GET() {
  const state = runtime.getState();
  const uptime = runtime.getUptime();
  
  return NextResponse.json({
    status: 'Operational',
    coreState: state,
    uptime: `${Math.floor(uptime)}s`,
    timestamp: new Date().toISOString(),
    node: (process as any).version || '24.x'
  });
}
