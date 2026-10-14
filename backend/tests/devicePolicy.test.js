const test = require('node:test');
const assert = require('node:assert/strict');
const { shouldStoreMessages, shouldDownloadMedia } = require('../src/utils/devicePolicy');

test('device null/undefined: perilaku lama (simpan & unduh)', () => {
  assert.equal(shouldStoreMessages(null), true);
  assert.equal(shouldStoreMessages(undefined), true);
  assert.equal(shouldDownloadMedia(null), true);
  assert.equal(shouldDownloadMedia(undefined), true);
});

test('device tanpa kolom baru (mis. baris lama sebelum ALTER TABLE): perilaku lama', () => {
  const legacyDevice = { session_id: 'legacy_device_1', webhook_url: 'https://x', auto_read: false };
  assert.equal(shouldStoreMessages(legacyDevice), true);
  assert.equal(shouldDownloadMedia(legacyDevice), true);
});

test('device dengan kolom eksplisit true: tetap true', () => {
  assert.equal(shouldStoreMessages({ store_messages: true }), true);
  assert.equal(shouldDownloadMedia({ download_media: true }), true);
});

test('device dengan kolom eksplisit false: matikan fitur', () => {
  assert.equal(shouldStoreMessages({ store_messages: false }), false);
  assert.equal(shouldDownloadMedia({ download_media: false }), false);
});

test('kolom di Postgres bisa balik sebagai null (bukan hanya undefined): tetap perilaku lama', () => {
  assert.equal(shouldStoreMessages({ store_messages: null }), true);
  assert.equal(shouldDownloadMedia({ download_media: null }), true);
});

test('bentuk baris device legacy_device_1 yang sesungguhnya (tanpa kolom baru): tidak berubah', () => {
  // Meniru bentuk baris `devices` produksi sebelum migrasi Rencana 2 berjalan.
  const legacyDevice = {
    id: 1, session_id: 'legacy_device_1', name: 'Legacy Device',
    webhook_url: 'https://app.example.com/api/webhook/whatsapp',
    webhook_secret: 'contoh-secret', auto_read: false, api_token_id: null,
  };
  assert.equal(shouldStoreMessages(legacyDevice), true);
  assert.equal(shouldDownloadMedia(legacyDevice), true);
});

test('device yang mematikan retensi & unduhan media', () => {
  const privacyDevice = {
    session_id: 'tenant_11111111-2222-3333-4444-555555555555',
    webhook_url: 'https://app.example.com/api/whatsapp/webhook',
    webhook_secret: 'rahasia-tenant', store_messages: false, download_media: false, webhook_retry: true,
  };
  assert.equal(shouldStoreMessages(privacyDevice), false);
  assert.equal(shouldDownloadMedia(privacyDevice), false);
});
