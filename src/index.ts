
import { IncomingMessage, ServerResponse, createServer } from 'http';
import { runtime } from './services/coreRuntime';

/**
 * MOS Core Serverless Entry Point (High Integrity)
 * Optimized for Node 24.x Runtime on Vercel.
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // Enhanced CORS for production
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Platform-Key, Authorization');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Robust URL parsing for Node 24
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `${protocol}://${host}`);

  try {
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
        timestamp: new Date().toISOString(),
        // Fix: Use type assertion to access node version property from process global to resolve TS error
        nodeVersion: (process as any).version
      }));
      return;
    }

    // 3. Root Endpoint / API Discovery
    res.writeHead(200);
    res.end(JSON.stringify(runtime.envelope({ 
      service: "LyncApp Mobility Operating System",
      version: "2.0.0-node24",
      capabilities: ["RPC_V1", "WEB3_ANCHORING", "STATE_ISOLATION", "RESILIENT_CIRCUIT"],
      endpoints: {
        health: "/core/health",
        state: "/core/state",
        api: "/api/v1 (Requires Platform Key)"
      }
    })));
  } catch (err: any) {
    res.writeHead(500);
    res.end(JSON.stringify({
      error: "INTERNAL_SERVER_ERROR",
      message: err.message,
      timestamp: new Date().toISOString()
    }));
  }
}

/**
 * Local Development Server Support
 */
// Fix: Access require and module through globalThis to resolve "Cannot find name" errors in TypeScript
const nodeRequire = (globalThis as any).require;
const nodeModule = (globalThis as any).module;

if (process.env.NODE_ENV !== 'production' && nodeRequire?.main === nodeModule) {
  const PORT = process.env.PORT || 3000;
  // Fix: Use createServer imported from 'http' instead of require to satisfy TypeScript and Node.js environments
  const server = createServer(handler);
  server.listen(PORT, () => {
    // Fix: Use type assertion to access node version property from process global to resolve TS error
    console.log(`[MOS-CORE-DEPLOY] Node ${(process as any).version} Instance on port ${PORT}`);
  });
}
