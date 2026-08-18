const crypto = require('crypto');
const { pool } = require('../config/postgres');

/**
 * List all API Keys
 */
async function listApiKeys(req, res) {
  try {
    const result = await pool.query(
      `SELECT t.id, t.name, t.token, t.is_active, t.last_used_at, t.created_at, u.username as owner
       FROM api_tokens t
       LEFT JOIN users u ON t.user_id = u.id
       ORDER BY t.id DESC`
    );

    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list API Keys.', error: err.message });
  }
}

/**
 * Generate a new API Key
 */
async function createApiKey(req, res) {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Key name / description is required.' });
  }

  // Generate high-entropy API key
  const randomHex = crypto.randomBytes(24).toString('hex');
  const token = `wa_live_${randomHex}`;

  try {
    const result = await pool.query(
      `INSERT INTO api_tokens (name, token, user_id, is_active)
       VALUES ($1, $2, $3, TRUE) RETURNING *`,
      [name, token, req.user?.id || null]
    );

    return res.status(201).json({
      success: true,
      message: 'API Key generated successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to generate API Key.', error: err.message });
  }
}

/**
 * Toggle API Key Active status
 */
async function toggleApiKey(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE api_tokens SET is_active = NOT is_active WHERE id = $1 RETURNING *`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'API Key not found.' });
    }

    return res.json({ success: true, message: 'API Key status updated.', data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update API Key.', error: err.message });
  }
}

/**
 * Delete API Key
 */
async function deleteApiKey(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM api_tokens WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'API Key not found.' });
    }

    return res.json({ success: true, message: 'API Key revoked and deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete API Key.', error: err.message });
  }
}

module.exports = {
  listApiKeys,
  createApiKey,
  toggleApiKey,
  deleteApiKey
};
