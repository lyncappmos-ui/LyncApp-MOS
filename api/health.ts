
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runtime } from '../services/coreRuntime';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const state = runtime.getState();
  const isHealthy = state === 'READY' || state === 'READ_ONLY';
  
  return res.status(200).json({
    status: state,
    healthy: isHealthy,
    version: "2.2.0",
    // Fix: Cast process to any to avoid missing version property error on standard Process type
    node: (process as any).version,
    timestamp: new Date().toISOString()
  });
}
