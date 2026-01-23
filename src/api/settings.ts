
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MOCK_DB } from '../services/db';
import { runtime } from '../services/coreRuntime';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const result = await runtime.executeSafe(async () => {
    return MOCK_DB.saccos[0] || null;
  }, null);

  return res.status(200).json({
    status: result.error ? 'error' : 'success',
    data: result.data,
    fallback: !!result.error
  });
}
