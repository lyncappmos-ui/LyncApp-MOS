
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runtime } from '../services/coreRuntime';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const health = await runtime.checkDependencies();
  const response = runtime.envelope({
    uptime: runtime.getUptime(),
    lastHealthyAt: runtime.getLastHealthyAt(),
    dependencies: health,
    config: {
      isSupabaseConnected: !!process.env.SUPABASE_URL,
      // Fix: Cast process to any to avoid missing version property error
      nodeVersion: (process as any).version
    }
  });

  return res.status(200).json(response);
}
