const { pool } = require('../config/postgres');

/**
 * Verify whether the incoming request (JWT admin or API Key) is authorized to access/operate on the given sessionId.
 *
 * Rules:
 * 1. Admin via Dashboard JWT (req.user): full access to all sessions.
 * 2. API Key (req.apiKey):
 *    - If device has api_token_id set, it MUST match req.apiKey.id.
 *    - If device has api_token_id === null (global/legacy session), access is allowed
 *      so existing integrations do not break.
 *    - If device does not exist: returns 404.
 *
 * @param {string} sessionId
 * @param {object} req - Express request object
 * @returns {Promise<{ allowed: boolean, status?: number, message?: string, device?: object }>}
 */
async function verifySessionOwnership(sessionId, req) {
  if (!sessionId) {
    return { allowed: false, status: 400, message: 'sessionId is required.' };
  }

  // Admin Dashboard has full access
  if (req.user) {
    return { allowed: true };
  }

  if (req.apiKey) {
    const res = await pool.query(
      'SELECT id, session_id, name, api_token_id FROM devices WHERE session_id = $1',
      [sessionId]
    );

    if (res.rows.length === 0) {
      return { allowed: false, status: 404, message: `Session "${sessionId}" not found.` };
    }

    const device = res.rows[0];

    // If device is explicitly assigned to an API key
    if (device.api_token_id !== null && device.api_token_id !== undefined) {
      if (device.api_token_id !== req.apiKey.id) {
        return {
          allowed: false,
          status: 403,
          message: `Akses ditolak. Session "${sessionId}" bukan milik API Key ini.`
        };
      }
    }

    // Otherwise it's global / legacy device, allowed
    return { allowed: true, device };
  }

  return { allowed: false, status: 401, message: 'Authentication required.' };
}

module.exports = { verifySessionOwnership };
