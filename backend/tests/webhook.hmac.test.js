const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { createCapturingServer, listen, close } = require('./helpers/httpTarget');

// Model Mongoose butuh koneksi nyata; WebhookLog.create dibungkus try/catch di webhook.js,
// jadi tes ini boleh berjalan tanpa Mongo — logging yang gagal tidak menggagalkan pengiriman.
const { dispatchWebhook } = require('../src/services/webhook');

test('mengirim X-Signature & X-Signature-Timestamp saat secret ada, tervalidasi HMAC-SHA256', async () => {
  const { server, received } = createCapturingServer();
  const port = await listen(server);
  try {
    await dispatchWebhook('sess1', `http://127.0.0.1:${port}/hook`, 'rahasia123', 'message.received', { text: 'hi' });

    assert.equal(received.length, 1);
    const req = received[0];
    assert.ok(req.headers['x-webhook-secret'], 'header lama X-Webhook-Secret tetap ada');
    assert.equal(req.headers['authorization'], 'Bearer rahasia123');
    assert.ok(req.headers['x-signature-timestamp']);
    assert.ok(req.headers['x-signature']);

    const expected = crypto.createHmac('sha256', 'rahasia123')
      .update(`${req.headers['x-signature-timestamp']}.${req.rawBody}`)
      .digest('hex');
    assert.equal(req.headers['x-signature'], expected);
  } finally {
    await close(server);
  }
});

test('tanpa secret: tidak ada header HMAC sama sekali (perilaku lama)', async () => {
  const { server, received } = createCapturingServer();
  const port = await listen(server);
  try {
    await dispatchWebhook('sess1', `http://127.0.0.1:${port}/hook`, null, 'message.received', { text: 'hi' });
    assert.equal(received[0].headers['x-signature'], undefined);
    assert.equal(received[0].headers['x-webhook-secret'], undefined);
  } finally {
    await close(server);
  }
});

test('targetUrl kosong: tidak melakukan apa pun (tidak melempar)', async () => {
  await assert.doesNotReject(dispatchWebhook('sess1', '', 'x', 'message.received', {}));
  await assert.doesNotReject(dispatchWebhook('sess1', undefined, 'x', 'message.received', {}));
});
