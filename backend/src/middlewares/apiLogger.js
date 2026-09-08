const { pool } = require('../config/postgres');

/**
 * Middleware to asynchronously log API calls to api_usage_logs
 */
function apiLogger(req, res, next) {
  const startTime = Date.now();

  // Intercept the response finish event
  res.on('finish', () => {
    try {
      const responseTime = Date.now() - startTime;
      const statusCode = res.statusCode;
      const method = req.method;
      const endpoint = req.baseUrl ? `${req.baseUrl}${req.path}` : req.originalUrl || req.url;

      // Extract sessionId if present
      const sessionId = req.body?.sessionId || req.params?.sessionId || req.query?.sessionId || null;

      // Extract api_token_id if request came via API key
      const apiTokenId = req.apiKey?.id || null;

      // Extract client IP
      const ipAddress = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '').split(',')[0].trim();

      // Don't block response cycle, run query in background
      pool.query(
        `INSERT INTO api_usage_logs (api_token_id, session_id, endpoint, method, status_code, response_time_ms, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [apiTokenId, sessionId, endpoint, method, statusCode, responseTime, ipAddress]
      ).catch(err => {
        console.error('[apiLogger] Failed to write usage log:', err.message);
      });
    } catch (e) {
      console.error('[apiLogger] Interceptor error:', e.message);
    }
  });

  next();
}

module.exports = { apiLogger };
