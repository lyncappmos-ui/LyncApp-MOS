
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { MOSService } from '../services/mosService';
import { MOCK_DB } from '../services/db';
import { runtime } from '../services/coreRuntime';
import { TripStatus } from '../types';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Platform-Key');

  if (req.method === 'OPTIONS') return res.status(204).end();

  if (req.method === 'POST') {
    const { action, tripId, status } = req.body;
    
    const result = await runtime.executeSafe(async () => {
      if (action === 'dispatch') return await MOSService.updateTripStatus(tripId, TripStatus.ACTIVE);
      if (action === 'update_status') return await MOSService.updateTripStatus(tripId, status);
      throw new Error("INVALID_ACTION");
    }, null as any, { isWrite: true });

    return res.status(200).json(result);
  }

  const result = await runtime.executeSafe(async () => MOCK_DB.trips, []);
  return res.status(200).json(result);
}
