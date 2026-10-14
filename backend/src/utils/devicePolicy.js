/**
 * Kebijakan penyimpanan pesan & pengunduhan media, dibaca dari baris `devices`.
 * PRINSIP: hanya `false` eksplisit yang mematikan fitur. `undefined`/`null`/tanpa kolom
 * (baris device lama sebelum kolom ini ada, termasuk device legacy) SELALU berperilaku lama.
 */

function shouldStoreMessages(device) {
  return device?.store_messages !== false;
}

function shouldDownloadMedia(device) {
  return device?.download_media !== false;
}

module.exports = { shouldStoreMessages, shouldDownloadMedia };
