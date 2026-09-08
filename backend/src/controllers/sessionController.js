const { pool } = require('../config/postgres');
const {
  initSession,
  requestPairingCode,
  getSessionSocket,
  getSessionQR,
  getSessionPairingCode,
  logoutSession,
  restartSession,
  sessions
} = require('../services/baileys');
const { verifySessionOwnership } = require('../utils/sessionGuard');

/**
 * List all sessions/devices
 * - If called via API Key: only returns sessions assigned to this API Key or global sessions
 * - If called via Admin JWT: returns all sessions with token owner information
 */
async function listSessions(req, res) {
  try {
    let query;
    const params = [];

    if (req.apiKey) {
      query = `
        SELECT d.*, t.name as token_name 
        FROM devices d 
        LEFT JOIN api_tokens t ON d.api_token_id = t.id 
        WHERE d.api_token_id = $1 OR d.api_token_id IS NULL
        ORDER BY d.id DESC
      `;
      params.push(req.apiKey.id);
    } else {
      query = `
        SELECT d.*, t.name as token_name 
        FROM devices d 
        LEFT JOIN api_tokens t ON d.api_token_id = t.id 
        ORDER BY d.id DESC
      `;
    }

    const result = await pool.query(query, params);
    const devices = result.rows.map(dev => {
      const sock = sessions.get(dev.session_id);
      const isLiveActive = !!sock?.user;
      return {
        ...dev,
        is_live_active: isLiveActive,
        user_info: sock?.user || null
      };
    });

    return res.json({ success: true, data: devices });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list sessions.', error: err.message });
  }
}

/**
 * Create a new session and initialize Baileys connection
 * - Automatically assigns session to caller's API Key if called via API Key
 * - Allows admin via dashboard to optionally assign to an API Key or leave as global
 */
async function createSession(req, res) {
  const { sessionId, name, webhookUrl, webhookSecret, autoRead, apiTokenId } = req.body;

  if (!sessionId || !name) {
    return res.status(400).json({ success: false, message: 'sessionId and name are required.' });
  }

  // Validate session ID format (alphanumeric, dashes, underscores)
  const cleanId = String(sessionId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!cleanId) {
    return res.status(400).json({ success: false, message: 'Invalid sessionId format.' });
  }

  // Determine assigned API Token ID
  let assignedTokenId = null;
  if (req.apiKey) {
    assignedTokenId = req.apiKey.id;
  } else if (apiTokenId) {
    assignedTokenId = parseInt(apiTokenId, 10) || null;
  }

  try {
    const existing = await pool.query('SELECT id FROM devices WHERE session_id = $1', [cleanId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: `Session "${cleanId}" already exists.` });
    }

    const insertRes = await pool.query(
      `INSERT INTO devices (session_id, name, webhook_url, webhook_secret, auto_read, status, api_token_id)
       VALUES ($1, $2, $3, $4, $5, 'connecting', $6) RETURNING *`,
      [cleanId, name, webhookUrl || null, webhookSecret || null, !!autoRead, assignedTokenId]
    );

    // Trigger Baileys socket initialization
    initSession(cleanId).catch(err => {
      console.error(`[Session Controller] Async init error for ${cleanId}:`, err.message);
    });

    return res.status(201).json({
      success: true,
      message: `Session "${cleanId}" created. Initializing QR code generation...`,
      data: insertRes.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create session.', error: err.message });
  }
}

/**
 * Get session status & device details
 */
async function getSessionStatus(req, res) {
  const { sessionId } = req.params;

  const authCheck = await verifySessionOwnership(sessionId, req);
  if (!authCheck.allowed) {
    return res.status(authCheck.status || 403).json({ success: false, message: authCheck.message });
  }

  try {
    const result = await pool.query(
      `SELECT d.*, t.name as token_name 
       FROM devices d 
       LEFT JOIN api_tokens t ON d.api_token_id = t.id 
       WHERE d.session_id = $1`,
      [sessionId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Session "${sessionId}" not found.` });
    }

    const device = result.rows[0];
    const sock = sessions.get(sessionId);
    const qrInfo = getSessionQR(sessionId);
    const pairingInfo = getSessionPairingCode(sessionId);

    return res.json({
      success: true,
      data: {
        ...device,
        is_live_connected: !!sock?.user,
        user: sock?.user || null,
        qr_available: !!qrInfo,
        pairing_available: !!pairingInfo
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking session status.', error: err.message });
  }
}

/**
 * Get current QR Code for a session
 */
async function getSessionQRRoute(req, res) {
  const { sessionId } = req.params;

  const authCheck = await verifySessionOwnership(sessionId, req);
  if (!authCheck.allowed) {
    return res.status(authCheck.status || 403).json({ success: false, message: authCheck.message });
  }

  const qrInfo = getSessionQR(sessionId);
  const sock = sessions.get(sessionId);

  if (sock?.user) {
    return res.json({
      success: true,
      status: 'connected',
      message: 'Session is already connected to WhatsApp.'
    });
  }

  if (!qrInfo) {
    initSession(sessionId).catch(() => {});
    return res.status(202).json({
      success: true,
      status: 'generating',
      message: 'QR code is currently being generated. Try again in a moment or listen via Socket.IO.'
    });
  }

  return res.json({
    success: true,
    status: 'qr_ready',
    data: {
      qr: qrInfo.dataUrl,
      raw: qrInfo.raw,
      updatedAt: qrInfo.updatedAt
    }
  });
}

/**
 * Request Pairing Code via Phone Number
 */
async function requestPairingCodeRoute(req, res) {
  const { sessionId } = req.params;
  const { phoneNumber } = req.body;

  const authCheck = await verifySessionOwnership(sessionId, req);
  if (!authCheck.allowed) {
    return res.status(authCheck.status || 403).json({ success: false, message: authCheck.message });
  }

  if (!phoneNumber) {
    return res.status(400).json({ success: false, message: 'phoneNumber is required (e.g. 628123456789).' });
  }

  try {
    const result = await requestPairingCode(sessionId, phoneNumber);
    return res.json({
      success: true,
      message: 'Pairing code generated successfully.',
      data: result
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to request pairing code.', error: err.message });
  }
}

/**
 * Restart a session
 */
async function restartSessionRoute(req, res) {
  const { sessionId } = req.params;

  const authCheck = await verifySessionOwnership(sessionId, req);
  if (!authCheck.allowed) {
    return res.status(authCheck.status || 403).json({ success: false, message: authCheck.message });
  }

  try {
    await restartSession(sessionId);
    return res.json({ success: true, message: `Session "${sessionId}" restarted.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to restart session.', error: err.message });
  }
}

/**
 * Logout from WhatsApp
 */
async function logoutSessionRoute(req, res) {
  const { sessionId } = req.params;

  const authCheck = await verifySessionOwnership(sessionId, req);
  if (!authCheck.allowed) {
    return res.status(authCheck.status || 403).json({ success: false, message: authCheck.message });
  }

  try {
    const result = await logoutSession(sessionId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to logout session.', error: err.message });
  }
}

/**
 * Update session settings (webhook URL, auto read, name, apiTokenId)
 */
async function updateSessionSettings(req, res) {
  const { sessionId } = req.params;
  const { name, webhookUrl, webhookSecret, autoRead, apiTokenId } = req.body;

  const authCheck = await verifySessionOwnership(sessionId, req);
  if (!authCheck.allowed) {
    return res.status(authCheck.status || 403).json({ success: false, message: authCheck.message });
  }

  try {
    // Only dashboard admin (req.user) can transfer or reassign api_token_id
    let tokenUpdateClause = '';
    const params = [name, webhookUrl, webhookSecret, autoRead, sessionId];

    if (req.user && apiTokenId !== undefined) {
      params.push(apiTokenId === '' || apiTokenId === null ? null : parseInt(apiTokenId, 10));
      tokenUpdateClause = `, api_token_id = $${params.length}`;
    }

    const result = await pool.query(
      `UPDATE devices 
       SET name = COALESCE($1, name),
           webhook_url = $2,
           webhook_secret = $3,
           auto_read = COALESCE($4, auto_read),
           updated_at = NOW()
           ${tokenUpdateClause}
       WHERE session_id = $5 RETURNING *`,
      params
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: `Session "${sessionId}" not found.` });
    }

    return res.json({ success: true, message: 'Session settings updated.', data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update session settings.', error: err.message });
  }
}

/**
 * Delete a session completely
 */
async function deleteSession(req, res) {
  const { sessionId } = req.params;

  const authCheck = await verifySessionOwnership(sessionId, req);
  if (!authCheck.allowed) {
    return res.status(authCheck.status || 403).json({ success: false, message: authCheck.message });
  }

  try {
    await logoutSession(sessionId);
    await pool.query('DELETE FROM devices WHERE session_id = $1', [sessionId]);
    return res.json({ success: true, message: `Session "${sessionId}" deleted successfully.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete session.', error: err.message });
  }
}

module.exports = {
  listSessions,
  createSession,
  getSessionStatus,
  getSessionQRRoute,
  requestPairingCodeRoute,
  restartSessionRoute,
  logoutSessionRoute,
  updateSessionSettings,
  deleteSession
};
