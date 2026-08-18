const jwt = require('jsonwebtoken');
const { pool } = require('../config/postgres');

const JWT_SECRET = process.env.JWT_SECRET || 'wa_gateway_super_jwt_secret_key_2026';

/**
 * Middleware for JWT Authentication (Admin Dashboard)
 */
function authJwt(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Unauthorized. Invalid or expired token.' });
  }
}

/**
 * Middleware for API Key Authentication (External Apps)
 */
async function authApiKey(req, res, next) {
  const apiKey = req.headers['x-api-key'] || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

  if (!apiKey) {
    return res.status(401).json({ success: false, message: 'Unauthorized. API Key is missing. Provide via X-API-Key or Bearer token header.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM api_tokens WHERE token = $1 AND is_active = TRUE',
      [apiKey]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Unauthorized. Invalid or inactive API Key.' });
    }

    const tokenRecord = result.rows[0];
    req.apiKey = tokenRecord;

    // Update last_used_at timestamp asynchronously
    pool.query('UPDATE api_tokens SET last_used_at = NOW() WHERE id = $1', [tokenRecord.id]).catch(() => {});

    next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Internal Server Error during auth check.', error: err.message });
  }
}

/**
 * Middleware allowing either JWT or API Key
 */
async function authAny(req, res, next) {
  const authHeader = req.headers.authorization;
  const xApiKey = req.headers['x-api-key'];

  // Check X-API-Key first
  if (xApiKey) {
    return authApiKey(req, res, next);
  }

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    
    // Attempt JWT verification first
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (jwtErr) {
      // If not JWT, check if it's an API Key in Bearer format
      return authApiKey(req, res, next);
    }
  }

  return res.status(401).json({ success: false, message: 'Authentication required. Provide Bearer JWT or API Key.' });
}

module.exports = {
  JWT_SECRET,
  authJwt,
  authApiKey,
  authAny
};
