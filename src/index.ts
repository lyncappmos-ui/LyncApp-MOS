
import { IncomingMessage, ServerResponse } from 'http';
import { runtime } from './services/coreRuntime';

/**
 * MOS Core Serverless Entry Point (High Integrity)
 * Targets: Health checks, State introspection, and API routing.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Platform-Key');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`);

  // 1. GET /core/state - Full machine-readable state dump
  if (url.pathname === '/core/state') {
    const health = await runtime.checkDependencies();
    res.writeHead(200);
    res.end(JSON.stringify(runtime.envelope({
      uptime: runtime.getUptime(),
      lastHealthyAt: runtime.getLastHealthyAt(),
      dependencies: health
    })));
    return;
  }

  // 2. GET /core/health - Simple heartbeat for load balancers
  if (url.pathname === '/core/health' || url.pathname === '/health') {
    const state = runtime.getState();
    const isHealthy = state === 'READY' || state === 'READ_ONLY';
    res.writeHead(isHealthy ? 200 : 503);
    res.end(JSON.stringify({ 
      status: state, 
      healthy: isHealthy,
      timestamp: new Date().toISOString() 
    }));
    return;
  }

  // 3. Root Endpoint
  res.writeHead(200);
  res.end(JSON.stringify(runtime.envelope({ 
    service: "LyncApp Mobility Operating System",
    capabilities: ["RPC_V1", "WEB3_ANCHORING", "STATE_ISOLATION"],
    endpoints: {
      health: "/core/health",
      state: "/core/state",
      api: "/api/v1 (RPC via Platform Key)"
    }
  })));
}

/**
 * Local Development
 */
if (typeof (globalThis as any).require !== 'undefined' && (globalThis as any).require.main === (globalThis as any).module) {
  const { createServer } = (globalThis as any).require('http');
  const PORT = process.env.PORT || 3000;
  const server = createServer(handler);
  server.listen(PORT, () => {
    console.log(`[MOS-CORE-RESILIENT] Node 24 Instance on port ${PORT}`);
  });
}
