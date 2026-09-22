const test = require('node:test');
const assert = require('node:assert/strict');
const { createFlakyServer, createCapturingServer, listen, close } = require('./helpers/httpTarget');
const { dispatchWebhook, __setRetryDelaysForTests } = require('../src/services/webhook');

// Jadwal produksi asli ~7,5 menit (0, 30d, 60d, 120d, 240d). Tes memakai jeda singkat namun
// tetap ASLI (setTimeout sungguhan, bukan mock waktu) agar logika retry teruji apa adanya.
test.before(() => __setRetryDelaysForTests([0, 20, 40, 60, 80]));
test.after(() => __setRetryDelaysForTests(null)); // kembalikan ke jadwal produksi

test('retry=false (default): gagal sekali, tidak mencoba lagi', async () => {
  const { server, callCount } = createFlakyServer(99); // selalu gagal
  const port = await listen(server);
  try {
    await dispatchWebhook('sess1', `http://127.0.0.1:${port}/hook`, 's', 'message.received', {});
    assert.equal(callCount(), 1);
  } finally {
    await close(server);
  }
});

test('retry=true: mencoba lagi sampai sukses, mencatat nomor attempt', async () => {
  const { server, received, callCount } = createFlakyServer(2); // gagal 2x, sukses di percobaan ke-3
  const port = await listen(server);
  try {
    await dispatchWebhook('sess1', `http://127.0.0.1:${port}/hook`, 's', 'message.received', {}, { retry: true });
    assert.equal(callCount(), 3);
    assert.deepEqual(received.map((r) => r.attempt), [1, 2, 3]);
  } finally {
    await close(server);
  }
});

test('retry=true tapi gagal terus: berhenti setelah 5 percobaan, tidak melempar', async () => {
  const { server, callCount } = createFlakyServer(99);
  const port = await listen(server);
  try {
    await assert.doesNotReject(
      dispatchWebhook('sess1', `http://127.0.0.1:${port}/hook`, 's', 'message.received', {}, { retry: true })
    );
    assert.equal(callCount(), 5);
  } finally {
    await close(server);
  }
});

test('retry=true dan sukses di percobaan pertama: hanya 1 kali panggil (tidak ada jeda tak perlu)', async () => {
  const { server, received } = createCapturingServer();
  const port = await listen(server);
  const startedAt = Date.now();
  try {
    await dispatchWebhook('sess1', `http://127.0.0.1:${port}/hook`, 's', 'message.received', {}, { retry: true });
    assert.equal(received.length, 1);
    assert.ok(Date.now() - startedAt < 2000, 'tidak boleh menunggu jeda retry bila percobaan pertama sukses');
  } finally {
    await close(server);
  }
});

test('tanpa override (jadwal produksi): jeda pertama tetap 0 (percobaan pertama instan)', async () => {
  __setRetryDelaysForTests(null); // sengaja pakai jadwal produksi asli untuk tes ini
  const { server, received } = createCapturingServer();
  const port = await listen(server);
  const startedAt = Date.now();
  try {
    await dispatchWebhook('sess1', `http://127.0.0.1:${port}/hook`, 's', 'message.received', {}, { retry: true });
    assert.equal(received.length, 1);
    assert.ok(Date.now() - startedAt < 2000, 'percobaan pertama tidak pernah menunggu, di jadwal manapun');
  } finally {
    await close(server);
    __setRetryDelaysForTests([0, 20, 40, 60, 80]); // pulihkan untuk tes berikutnya di berkas ini
  }
});
