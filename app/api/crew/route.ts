
import { NextRequest, NextResponse } from 'next/server';
import { MOCK_DB } from '@/services/db';
import { runtime } from '@/core/coreRuntime';
// Import MOSService to handle crew creation
import { MOSService } from '@/services/mosService';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result = await runtime.executeSafe(async () => {
    return MOCK_DB.crews || [];
  }, []);
  return NextResponse.json(result);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (!body || !body.name) {
      return NextResponse.json({ error: 'Payload missing required field "name"' }, { status: 400 });
    }

    const result = await runtime.executeSafe(async () => {
      // Use MOSService.addCrew instead of non-existent runtime.createOperator
      return await MOSService.addCrew(body);
    }, null as any, { isWrite: true });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }
}
