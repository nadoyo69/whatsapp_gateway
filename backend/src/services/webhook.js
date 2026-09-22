const axios = require('axios');
const crypto = require('crypto');
const mongoose = require('mongoose');
const WebhookLog = require('../models/mongo/WebhookLog');

const PRODUCTION_RETRY_DELAYS_MS = [0, 30000, 60000, 120000, 240000]; // ~5 percobaan dalam ±7.5 menit
let retryDelaysOverride = null; // hanya diisi oleh tes

/** Hanya untuk tes: pakai jadwal jeda cepat (atau null untuk kembali ke jadwal produksi). */
function __setRetryDelaysForTests(delaysMs) {
  retryDelaysOverride = delaysMs;
}

function getRetryDelays() {
  return retryDelaysOverride || PRODUCTION_RETRY_DELAYS_MS;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function attemptDelivery(sessionId, targetUrl, secretToken, event, payload, attempt) {
  const startTime = Date.now();
  const requestPayload = {
    event,
    sessionId,
    timestamp: new Date().toISOString(),
    data: payload
  };
  const bodyString = JSON.stringify(requestPayload);

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'WA-Gateway-Webhook/1.0'
  };

  if (secretToken) {
    headers['X-Webhook-Secret'] = secretToken;
    headers['Authorization'] = `Bearer ${secretToken}`;
    // HMAC aditif: penerima yang belum memverifikasinya tetap menerima request seperti biasa.
    // Ditandatangani atas STRING PERSIS yang dikirim (bodyString), bukan objek yang di-serialize
    // ulang oleh penerima, agar verifikasi byte-demi-byte tidak meleset karena urutan field.
    const signatureTimestamp = String(Date.now());
    headers['X-Signature-Timestamp'] = signatureTimestamp;
    headers['X-Signature'] = crypto
      .createHmac('sha256', secretToken)
      .update(`${signatureTimestamp}.${bodyString}`)
      .digest('hex');
  }

  let responseStatus = null;
  let responseBody = null;
  let errorMessage = null;
  let success = false;

  try {
    const response = await axios.post(targetUrl, bodyString, { headers, timeout: 10000 });
    responseStatus = response.status;
    responseBody = response.data;
    success = response.status >= 200 && response.status < 300;
  } catch (err) {
    errorMessage = err.message;
    if (err.response) {
      responseStatus = err.response.status;
      responseBody = err.response.data;
    }
    success = false;
  }

  const executionTimeMs = Date.now() - startTime;

  // Persist log to MongoDB asynchronously. Bila Mongo belum terhubung, gagal cepat alih-alih
  // menunggu penuh bufferTimeoutMS (10s bawaan Mongoose) untuk tiap percobaan pengiriman.
  if (mongoose.connection.readyState === 1) {
    try {
      await WebhookLog.create({
        session_id: sessionId,
        event,
        target_url: targetUrl,
        request_payload: requestPayload,
        response_status: responseStatus,
        response_body: responseBody,
        error_message: errorMessage,
        execution_time_ms: executionTimeMs,
        success,
        attempt
      });
    } catch (dbErr) {
      console.error('[Webhook] Failed to save webhook log to MongoDB:', dbErr.message);
    }
  } else {
    console.warn('[Webhook] Mongo belum terhubung; log webhook dilewati untuk', sessionId, event);
  }

  return success;
}

/**
 * Dispatch an event to a target webhook URL.
 * @param {string} sessionId
 * @param {string} targetUrl
 * @param {string} secretToken
 * @param {string} event
 * @param {object} payload
 * @param {{ retry?: boolean }} [options] - retry: opt-in per device (default false = perilaku lama, 1x percobaan).
 */
async function dispatchWebhook(sessionId, targetUrl, secretToken, event, payload, options = {}) {
  if (!targetUrl) return;
  const delays = options.retry ? getRetryDelays() : [0];

  for (let i = 0; i < delays.length; i += 1) {
    if (delays[i] > 0) await sleep(delays[i]);
    const success = await attemptDelivery(sessionId, targetUrl, secretToken, event, payload, i + 1);
    if (success) return;
  }
}

module.exports = { dispatchWebhook, __setRetryDelaysForTests };
