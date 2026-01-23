
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MetricsService } from '../services/metricsService';
import { runtime } from '../services/coreRuntime';
import { AuthService } from '../services/authService';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Platform-Key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  const key = req.headers['x-platform-key'] as string;
  const type = req.query.type as string || 'operational';

  const result = await runtime.executeSafe(async () => {
    if (key) AuthService.authorize(key, type === 'growth' ? 'growth_metrics' : 'operational_metrics');
    
    if (type === 'growth') return MetricsService.getGrowthMetrics();
    if (type === 'revenue') return MetricsService.getRevenueIntegrity();
    return MetricsService.getPlatformOperations();
  }, {} as any); // Fix: Cast empty object to any to satisfy the complex union return type of MetricsService methods

  return res.status(200).json(result);
}
