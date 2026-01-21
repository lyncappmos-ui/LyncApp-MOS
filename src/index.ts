import { IncomingMessage, ServerResponse } from 'http';
import { LyncMOS } from './services/MOSAPI';

/**
 * MOS Core Serverless Entry Point
 * Designed for Vercel Node.js Runtime (24.x)
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS Headers for platform interoperability
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

  // Health Probe
  if (url.pathname === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ 
      status: "MOS Core healthy", 
      // Fix: Cast process to any to access the uptime method which may not be recognized by the current TypeScript environment.
      uptime: (process as any).uptime(), 
      timestamp: new Date().toISOString() 
    }));
    return;
  }

  // Root Status Endpoint
  res.writeHead(200);
  res.end(JSON.stringify({ 
    status: "MOS Core running", 
    service: "LyncApp Mobility Operating System",
    version: "1.0.0-serverless",
    engine: "Node.js 24",
    timestamp: new Date().toISOString(),
    endpoints: {
      health: "/health",
      api: "/api/v1 (available via Platform RPC)"
    }
  }));
}

/**
 * Local Development Support
 * Allows running with `ts-node src/index.ts`
 */
// Fix: Access Node-specific globals 'require' and 'module' via globalThis with type assertions to resolve compiler errors in environments where Node types are not explicitly available.
if (typeof (globalThis as any).require !== 'undefined' && (globalThis as any).require.main === (globalThis as any).module) {
  // Fix: Access require via globalThis to bypass "Cannot find name 'require'" errors.
  const { createServer } = (globalThis as any).require('http');
  const PORT = process.env.PORT || 3000;
  const server = createServer(handler);
  server.listen(PORT, () => {
    console.log(`[MOS-CORE-DEV] Local instance listening on port ${PORT}`);
  });
}
