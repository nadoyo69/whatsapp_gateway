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
  const legacyDevice = { session_id: 'bukunadoyo_1', webhook_url: 'https://x', auto_read: false };
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
