
import { NextResponse } from 'next/server';
import { runtime } from '@/core/coreRuntime';

export const dynamic = 'force-dynamic';

export async function GET() {
  const health = await runtime.checkDependencies();
  const result = runtime.envelope({
    uptime: runtime.getUptime(),
    lastHealthyAt: runtime.getLastHealthyAt(),
    dependencies: health,
    config: {
      isSupabaseConnected: !!process.env.SUPABASE_URL,
      nodeVersion: (process as any).version || '24.x'
    }
  });
  return NextResponse.json(result);
}
