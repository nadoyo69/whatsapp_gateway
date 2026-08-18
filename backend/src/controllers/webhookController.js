const axios = require('axios');
const WebhookLog = require('../models/mongo/WebhookLog');

/**
 * Get Webhook Delivery Logs with filters and pagination
 */
async function getWebhookLogs(req, res) {
  const { sessionId, event, success, limit = 50, page = 1 } = req.query;

  const query = {};
  if (sessionId) query.session_id = sessionId;
  if (event) query.event = event;
  if (success !== undefined) query.success = success === 'true';

  try {
    const total = await WebhookLog.countDocuments(query);
    const logs = await WebhookLog.find(query)
      .sort({ created_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data: logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to retrieve webhook logs.', error: err.message });
  }
}

/**
 * Send a test webhook ping to a custom target URL
 */
async function testWebhook(req, res) {
  const { url, secret, event = 'test.ping' } = req.body;

  if (!url) {
    return res.status(400).json({ success: false, message: 'Webhook url is required.' });
  }

  const startTime = Date.now();
  const testPayload = {
    event,
    sessionId: 'test_session_sample',
    timestamp: new Date().toISOString(),
    data: {
      message: 'This is a test webhook event from WA Gateway.',
      testId: Math.random().toString(36).substring(7)
    }
  };

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'WA-Gateway-Webhook-Tester/1.0'
  };

  if (secret) {
    headers['X-Webhook-Secret'] = secret;
    headers['Authorization'] = `Bearer ${secret}`;
  }

  try {
    const response = await axios.post(url, testPayload, { headers, timeout: 10000 });
    const executionTimeMs = Date.now() - startTime;

    return res.json({
      success: true,
      message: 'Webhook test executed successfully.',
      status: response.status,
      executionTimeMs,
      responseBody: response.data
    });
  } catch (err) {
    const executionTimeMs = Date.now() - startTime;
    return res.status(err.response?.status || 500).json({
      success: false,
      message: 'Webhook test delivery failed.',
      error: err.message,
      executionTimeMs,
      responseStatus: err.response?.status || null,
      responseBody: err.response?.data || null
    });
  }
}

module.exports = {
  getWebhookLogs,
  testWebhook
};
