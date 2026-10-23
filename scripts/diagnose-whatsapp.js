// Diagnose why a server cannot link WhatsApp. Run it INSIDE the backend container; it uses a
// throw-away auth folder and never touches your real sessions:
//
//   docker compose exec -T wa-backend node - < scripts/diagnose-whatsapp.js
//
// It checks, in order: DNS, TCP/TLS to web.whatsapp.com, the WebSocket handshake, the Baileys
// version lookup, and finally a real Baileys connection from a fresh session (waits for a QR).

const dns = require('node:dns').promises;
const net = require('node:net');
const tls = require('node:tls');
const https = require('node:https');
const os = require('node:os');
const fs = require('node:fs');
const path = require('node:path');

const HOST = 'web.whatsapp.com';
const t0 = Date.now();
const since = () => `${((Date.now() - t0) / 1000).toFixed(1)}s`;
const log = (ok, msg) => console.log(`${ok === null ? '  ' : ok ? 'OK  ' : 'FAIL'} [${since()}] ${msg}`);

function timeLimit(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${label}: timeout ${ms / 1000}s`)), ms); });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

function tcpConnect(address, family) {
  return timeLimit(new Promise((resolve, reject) => {
    const started = Date.now();
    const socket = net.connect({ host: address, port: 443, family });
    socket.once('connect', () => { socket.destroy(); resolve(Date.now() - started); });
    socket.once('error', reject);
  }), 8000, `TCP ${address}`);
}

function tlsHandshake(address) {
  return timeLimit(new Promise((resolve, reject) => {
    const started = Date.now();
    const socket = tls.connect({ host: address, port: 443, servername: HOST }, () => {
      const info = `${socket.getProtocol()} cert=${socket.getPeerCertificate()?.subject?.CN || '?'}`;
      socket.destroy();
      resolve({ ms: Date.now() - started, info });
    });
    socket.once('error', reject);
  }), 8000, `TLS ${address}`);
}

async function checkNetwork() {
  console.log(`\n== 1. Network to ${HOST} (node ${process.version}, ${os.platform()} ${os.arch()})`);
  let v4 = [];
  let v6 = [];
  try { v4 = await dns.resolve4(HOST); log(true, `DNS A    : ${v4.join(', ')}`); } catch (e) { log(false, `DNS A    : ${e.code || e.message}`); }
  try { v6 = await dns.resolve6(HOST); log(true, `DNS AAAA : ${v6.join(', ')}`); } catch (e) { log(null, `DNS AAAA : ${e.code || e.message} (fine if the server has no IPv6)`); }

  for (const [list, family] of [[v4, 4], [v6, 6]]) {
    if (!list.length) continue;
    const address = list[0];
    try { log(true, `TCP IPv${family} ${address}:443 in ${await tcpConnect(address, family)}ms`); } catch (e) { log(false, `TCP IPv${family} ${address}:443 -> ${e.code || e.message}`); continue; }
    try { const r = await tlsHandshake(address); log(true, `TLS IPv${family} in ${r.ms}ms (${r.info})`); } catch (e) { log(false, `TLS IPv${family} -> ${e.code || e.message}`); }
  }
}

async function checkWebSocket() {
  console.log(`\n== 2. WebSocket handshake (what Baileys does first)`);
  let WebSocket;
  try { WebSocket = require('ws'); } catch { log(false, 'package "ws" not found (run this inside the backend container)'); return; }
  await timeLimit(new Promise((resolve) => {
    const started = Date.now();
    const ws = new WebSocket(`wss://${HOST}/ws/chat`, { origin: `https://${HOST}`, handshakeTimeout: 20000 });
    ws.once('open', () => { log(true, `WebSocket opened in ${Date.now() - started}ms`); ws.close(); resolve(); });
    ws.once('unexpected-response', (_req, res) => { log(false, `WebSocket rejected: HTTP ${res.statusCode}`); resolve(); });
    ws.once('error', (e) => { log(false, `WebSocket error: ${e.code || ''} ${e.message}`); resolve(); });
  }), 25000, 'WebSocket').catch((e) => log(false, e.message));
}

function checkVersionLookup() {
  console.log('\n== 3. Baileys version lookup (GitHub, used by fetchLatestBaileysVersion)');
  const url = 'https://raw.githubusercontent.com/WhiskeySockets/Baileys/master/src/Defaults/baileys-version.json';
  return timeLimit(new Promise((resolve) => {
    const started = Date.now();
    https.get(url, (res) => {
      let body = '';
      res.on('data', (d) => { body += d; });
      res.on('end', () => { log(res.statusCode === 200, `GitHub HTTP ${res.statusCode} in ${Date.now() - started}ms ${res.statusCode === 200 ? body.replace(/\s+/g, ' ').slice(0, 60) : ''}`); resolve(); });
    }).on('error', (e) => { log(false, `GitHub error: ${e.code || e.message}`); resolve(); });
  }), 20000, 'GitHub').catch((e) => log(false, e.message));
}

async function checkBaileys() {
  console.log('\n== 4. Real Baileys connection from a FRESH session (waits up to 60s for a QR)');
  let baileys;
  try { baileys = require('@whiskeysockets/baileys'); } catch { log(false, 'Baileys not found (run this inside the backend container)'); return; }
  const { default: makeWASocket, useMultiFileAuthState, fetchLatestBaileysVersion } = baileys;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-diagnose-'));
  const { state } = await useMultiFileAuthState(dir);
  let version;
  try { ({ version } = await fetchLatestBaileysVersion()); log(true, `WhatsApp Web version ${version.join('.')}`); } catch (e) { log(null, `version lookup failed (${e.message}); Baileys falls back to its built-in version`); }
  const started = Date.now();
  await new Promise((resolve) => {
    const sock = makeWASocket({ version, auth: state, printQRInTerminal: false, browser: ['WA-Gateway', 'Chrome', '124.0.0.0'], connectTimeoutMs: 60000, logger: { level: 'silent', child() { return this; }, trace() {}, debug() {}, info() {}, warn() {}, error() {}, fatal() {} } });
    const finish = (ok, msg) => { log(ok, msg); try { sock.end(undefined); } catch { /* already closed */ } resolve(); };
    const timer = setTimeout(() => finish(false, 'no QR within 60s'), 60000);
    sock.ev.on('connection.update', ({ connection, qr, lastDisconnect }) => {
      if (qr) { clearTimeout(timer); finish(true, `QR received after ${((Date.now() - started) / 1000).toFixed(1)}s -> this server CAN link WhatsApp`); }
      if (connection === 'close') {
        clearTimeout(timer);
        const err = lastDisconnect?.error;
        finish(false, `connection closed: status ${err?.output?.statusCode} - ${err?.message}`);
      }
    });
  });
  fs.rmSync(dir, { recursive: true, force: true });
}

(async () => {
  await checkNetwork();
  await checkWebSocket();
  await checkVersionLookup();
  await checkBaileys();
  console.log('\nDone. Send this whole output back.');
  process.exit(0);
})();
