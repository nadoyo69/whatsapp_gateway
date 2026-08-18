const axios = require('axios');
const WebhookLog = require('../models/mongo/WebhookLog');

/**
 * Dispatch an event to a target webhook URL
 * @param {string} sessionId 
 * @param {string} targetUrl 
 * @param {string} secretToken 
 * @param {string} event 
 * @param {object} payload 
 */
async function dispatchWebhook(sessionId, targetUrl, secretToken, event, payload) {
  if (!targetUrl) return;

  const startTime = Date.now();
  const requestPayload = {
    event,
    sessionId,
    timestamp: new Date().toISOString(),
    data: payload
  };

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'WA-Gateway-Webhook/1.0'
  };

  if (secretToken) {
    headers['X-Webhook-Secret'] = secretToken;
    headers['Authorization'] = `Bearer ${secretToken}`;
  }

  let responseStatus = null;
  let responseBody = null;
  let errorMessage = null;
  let success = false;

  try {
    const response = await axios.post(targetUrl, requestPayload, {
      headers,
      timeout: 10000 // 10s timeout
    });

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

  // Persist log to MongoDB asynchronously
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
      success
    });
  } catch (dbErr) {
    console.error('[Webhook] Failed to save webhook log to MongoDB:', dbErr.message);
  }
}

module.exports = { dispatchWebhook };
