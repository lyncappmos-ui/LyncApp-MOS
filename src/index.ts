
import { IncomingMessage, ServerResponse, createServer } from 'http';
import { runtime } from './services/coreRuntime';

/**
 * LyncApp MOS Core - Serverless Entry Point
 * Validated for Node 24.x Runtime
 */
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  // CORS Configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Platform-Key, Authorization');
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host || 'localhost';
  const url = new URL(req.url || '/', `${protocol}://${host}`);

  try {
    // Health Check
    if (url.pathname === '/core/health' || url.pathname === '/health' || url.pathname === '/api/health') {
      const state = runtime.getState();
      res.writeHead(200);
      res.end(JSON.stringify({ 
        status: state, 
        version: "2.1.0",
        node: (process as any).version,
        timestamp: new Date().toISOString()
      }));
      return;
    }

    // System State
    if (url.pathname === '/core/state') {
      const health = await runtime.checkDependencies();
      res.writeHead(200);
      res.end(JSON.stringify(runtime.envelope({
        uptime: runtime.getUptime(),
        dependencies: health
      })));
      return;
    }

    // Default API Response
    res.writeHead(200);
    res.end(JSON.stringify(runtime.envelope({ 
      message: "MOS Core Operational",
      runtime: "nodejs24.x",
      provider: "Vercel Serverless"
    })));
  } catch (err: any) {
    res.writeHead(500);
    res.end(JSON.stringify({
      error: "SERVER_FAULT",
      message: err.message
    }));
  }
}

// Local Dev Shim
const nodeRequire = (globalThis as any).require;
const nodeModule = (globalThis as any).module;
if (process.env.NODE_ENV !== 'production' && nodeRequire?.main === nodeModule) {
  const PORT = process.env.PORT || 3000;
  createServer(handler).listen(PORT, () => {
    console.log(`[MOS-LOCAL] Server listening on ${PORT} (Node ${(process as any).version})`);
  });
}
