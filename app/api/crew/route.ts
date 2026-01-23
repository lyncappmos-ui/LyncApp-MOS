
import { NextResponse } from 'next/server';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';

export async function GET() {
  const result = await runtime.executeSafe(async () => {
    return MOCK_DB.crews || [];
  }, []);

  return NextResponse.json(result);
}
