
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runtime } from '../services/coreRuntime';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const health = await runtime.checkDependencies();
  const result = runtime.envelope({
    uptime: runtime.getUptime(),
    lastHealthyAt: runtime.getLastHealthyAt(),
    dependencies: health,
    config: {
      isSupabaseConnected: !!process.env.SUPABASE_URL,
      nodeVersion: (process as any).version
    }
  });

  return res.status(200).json({
    status: result.error ? 'error' : 'success',
    data: result.data,
    fallback: !!result.error
  });
}
