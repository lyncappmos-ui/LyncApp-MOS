import { NextResponse } from 'next/server';
import { runtime } from '@/services/coreRuntime';

export async function GET() {
  const state = runtime.getState();
  return NextResponse.json({
    status: 'MOS Core is live',
    state: state,
    timestamp: new Date().toISOString(),
    // Fix: Cast process to any to avoid missing version property error
    node: (process as any).version
  });
}