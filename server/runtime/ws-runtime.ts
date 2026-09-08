import WebSocket, { WebSocketServer } from 'ws';
import { spawn } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { findLicenseByKey, activateLicense } from '../licenses';
import store from '../store';

dotenv.config();

const PORT = process.env.RUNTIME_WS_PORT ? Number(process.env.RUNTIME_WS_PORT) : 8081;
const JWT = process.env.JWT_SECRET || 'dev-token';

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws, req) => {
  const url = req.url || '';
  // token parsing
  const m = url.match(/token=([^&]+)/);
  const token = m ? decodeURIComponent(m[1]) : '';
  let authorized = false;
  if (token === JWT) authorized = true;
  // accept trusted tokens from store
  const s = store.load();
  if (!authorized && s.trusted_tokens && s.trusted_tokens.includes(token)) authorized = true;
  // accept license keys directly (VAMP-xxxx)
  if (!authorized && token && token.startsWith('VAMP-')) {
    const lic = findLicenseByKey(token);
    if (lic && lic.status === 'active' && (!lic.expires_at || new Date(lic.expires_at) > new Date())){
      try{ activateLicense(lic.id, req.socket.remoteAddress || 'unknown'); }catch{}
      authorized = true;
    }
  }

  if (!authorized) {
    ws.send(JSON.stringify({ error: 'unauthorized' }));
    ws.close();
    return;
  }

  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg.toString());
      if (data.type === 'execute') {
        const code = data.code || '';
        const luauPath = process.env.LUAU_PATH || 'luau';
        const child = spawn(luauPath, ['-e', code], { cwd: process.cwd() });
        child.stdout.on('data', (d) => ws.send(JSON.stringify({ type: 'stdout', data: d.toString() })));
        child.stderr.on('data', (d) => ws.send(JSON.stringify({ type: 'stderr', data: d.toString() })));
        child.on('close', (code) => ws.send(JSON.stringify({ type: 'exit', code })));
      }
    } catch (err) {
      ws.send(JSON.stringify({ error: 'invalid_message' }));
    }
  });
});

console.log(`VAMP runtime WebSocket listening on ws://localhost:${PORT} (token-based)`);
