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

/**
 * List all sessions/devices
 */
async function listSessions(req, res) {
  try {
    const result = await pool.query('SELECT * FROM devices ORDER BY id DESC');
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
 */
async function createSession(req, res) {
  const { sessionId, name, webhookUrl, webhookSecret, autoRead } = req.body;

  if (!sessionId || !name) {
    return res.status(400).json({ success: false, message: 'sessionId and name are required.' });
  }

  // Validate session ID format (alphanumeric, dashes, underscores)
  const cleanId = String(sessionId).trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
  if (!cleanId) {
    return res.status(400).json({ success: false, message: 'Invalid sessionId format.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM devices WHERE session_id = $1', [cleanId]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: `Session "${cleanId}" already exists.` });
    }

    const insertRes = await pool.query(
      `INSERT INTO devices (session_id, name, webhook_url, webhook_secret, auto_read, status)
       VALUES ($1, $2, $3, $4, $5, 'connecting') RETURNING *`,
      [cleanId, name, webhookUrl || null, webhookSecret || null, !!autoRead]
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

  try {
    const result = await pool.query('SELECT * FROM devices WHERE session_id = $1', [sessionId]);
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
    // If not initiated yet, start session
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
  try {
    const result = await logoutSession(sessionId);
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to logout session.', error: err.message });
  }
}

/**
 * Update session settings (webhook URL, auto read, name)
 */
async function updateSessionSettings(req, res) {
  const { sessionId } = req.params;
  const { name, webhookUrl, webhookSecret, autoRead } = req.body;

  try {
    const result = await pool.query(
      `UPDATE devices 
       SET name = COALESCE($1, name),
           webhook_url = $2,
           webhook_secret = $3,
           auto_read = COALESCE($4, auto_read),
           updated_at = NOW()
       WHERE session_id = $5 RETURNING *`,
      [name, webhookUrl, webhookSecret, autoRead, sessionId]
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
