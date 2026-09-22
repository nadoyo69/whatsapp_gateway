const http = require('node:http');

/** Server HTTP lokal yang mencatat setiap request masuk (header + body mentah). */
function createCapturingServer() {
  const received = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      received.push({ headers: req.headers, rawBody: raw, method: req.method });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  return { server, received };
}

/** Server yang gagal N kali (500) lalu sukses (200) — untuk tes retry. */
function createFlakyServer(failCount) {
  let calls = 0;
  const received = [];
  const server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      calls += 1;
      received.push({ headers: req.headers, rawBody: raw, attempt: calls });
      if (calls <= failCount) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ ok: false }));
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    });
  });
  return { server, received, callCount: () => calls };
}

function listen(server) {
  return new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve) => server.close(resolve));
}

module.exports = { createCapturingServer, createFlakyServer, listen, close };
