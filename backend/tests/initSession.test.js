const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { EventEmitter } = require('node:events');

process.env.SESSIONS_PATH = fs.mkdtempSync(path.join(os.tmpdir(), 'wa-sessions-'));

// --- stubs: replace Baileys and the database layer before loading the service -------------
const created = [];
function fakeSocket() {
  const sock = { ev: new EventEmitter(), user: undefined, end() {} };
  created.push(sock);
  return sock;
}
let versionDelayMs = 0;
const baileysStub = {
  default: () => fakeSocket(),
  useMultiFileAuthState: async () => ({ state: { creds: {}, keys: {} }, saveCreds: async () => {} }),
  DisconnectReason: { loggedOut: 401 },
  // Tanpa setTimeout bila tidak ada jeda, supaya tidak terikat pada timer palsu milik tes.
  fetchLatestBaileysVersion: () => {
    const result = { version: [2, 3000, 1], isLatest: true };
    return versionDelayMs ? new Promise((resolve) => setTimeout(() => resolve(result), versionDelayMs)) : Promise.resolve(result);
  },
  makeCacheableSignalKeyStore: (keys) => keys,
  downloadMediaMessage: async () => null,
  proto: { Message: { fromObject: () => ({}) } },
};
function stub(request, exportsObj) {
  const resolved = require.resolve(request, { paths: [path.join(__dirname, '../src/services')] });
  require.cache[resolved] = { id: resolved, filename: resolved, loaded: true, exports: exportsObj };
}
stub('@whiskeysockets/baileys', baileysStub);
stub('../config/postgres', { pool: { query: async () => ({ rows: [] }) } });
stub('./socket', { emitToSession() {}, emitGlobal() {} });

const { initSession } = require('../src/services/baileys');

test('banyak pemanggil bersamaan hanya membuka SATU soket (polling QR tidak membanjiri)', async () => {
  versionDelayMs = 50; // fetchLatestBaileysVersion lambat, seperti di server yang jaringannya lambat
  created.length = 0;
  const results = await Promise.all(Array.from({ length: 10 }, () => initSession('burst')));
  assert.equal(created.length, 1, 'harus tepat satu makeWASocket');
  assert.equal(results.length, 10);
});

test('pemanggilan saat soket masih connecting tidak membuat soket baru', async () => {
  versionDelayMs = 0;
  created.length = 0;
  await initSession('connecting1');
  const again = await initSession('connecting1');
  assert.equal(created.length, 1);
  assert.equal(again.status, 'connecting');
});

test('soket yang sudah tertutup (408) digantikan; setelah itu kembali idempoten', async (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] }); // jangan sampai timer reconnect 5 dtk menahan proses
  versionDelayMs = 0;
  created.length = 0;
  await initSession('closed1');
  assert.equal(created.length, 1);

  created[0].ev.emit('connection.update', { connection: 'close', lastDisconnect: { error: { output: { statusCode: 408 } } } });
  await new Promise((resolve) => setImmediate(resolve));

  await initSession('closed1');
  assert.equal(created.length, 2, 'soket mati harus diganti');
  await initSession('closed1');
  assert.equal(created.length, 2, 'soket baru yang hidup tidak digandakan');
  t.mock.timers.reset();
});

test('sesi berbeda tidak saling menghalangi', async () => {
  versionDelayMs = 0;
  created.length = 0;
  await Promise.all([initSession('a'), initSession('b'), initSession('c')]);
  assert.equal(created.length, 3);
});
