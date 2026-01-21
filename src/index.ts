
import { createServer } from 'http';
import { LyncMOS } from './services/MOSAPI';

const server = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  if (req.url === '/health') {
    res.writeHead(200);
    res.end(JSON.stringify({ status: "MOS Core healthy", timestamp: new Date().toISOString() }));
    return;
  }

  res.writeHead(200);
  res.end(JSON.stringify({ 
    status: "MOS Core running", 
    version: "1.0.0-backend",
    engine: "Node.js 22",
    timestamp: new Date().toISOString() 
  }));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`[MOS-CORE] Listening on port ${PORT}`);
});
