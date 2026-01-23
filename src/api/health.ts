
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runtime } from '../services/coreRuntime';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  const state = runtime.getState();
  
  res.status(200).json({ 
    status: 'MOS Core is live',
    state: state,
    timestamp: new Date().toISOString()
  });
}
