
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runtime } from '../src/services/coreRuntime';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  const state = runtime.getState();
  return res.status(200).json({
    status: state,
    timestamp: new Date().toISOString(),
    node: (process as any).version
  });
}
