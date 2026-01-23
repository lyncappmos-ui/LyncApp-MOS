
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MetricsService } from '../services/metricsService';
import { runtime } from '../services/coreRuntime';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const result = await runtime.executeSafe(async () => {
    return MetricsService.getPlatformOperations();
  }, {
    activeTripCount: 0,
    globalTicketVolume: 0,
    systemLoadFactor: 0,
    lastAnchorTimestamp: new Date().toISOString()
  });

  return res.status(200).json(result);
}
