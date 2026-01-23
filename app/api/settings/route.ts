
import { NextResponse } from 'next/server';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/services/coreRuntime';

export async function GET() {
  const result = await runtime.executeSafe(async () => {
    return MOCK_DB.saccos[0] || null;
  }, null);

  return NextResponse.json(result);
}
