const bcrypt = require('bcryptjs');
const { pool } = require('../config/postgres');

/**
 * List all Admin / Operator users
 */
async function listUsers(req, res) {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at, updated_at FROM users ORDER BY id ASC');
    return res.json({ success: true, data: result.rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to list users.', error: err.message });
  }
}

/**
 * Create a new user
 */
async function createUser(req, res) {
  const { username, email, password, role = 'admin' } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR (email IS NOT NULL AND email = $2)', [username, email || '']);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: 'Username or email is already taken.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, email, role, created_at`,
      [username, email || null, hashedPassword, role]
    );

    return res.status(201).json({
      success: true,
      message: 'User created successfully.',
      data: result.rows[0]
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to create user.', error: err.message });
  }
}

/**
 * Update user details
 */
async function updateUser(req, res) {
  const { id } = req.params;
  const { email, password, role } = req.body;

  try {
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (userRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    let query = 'UPDATE users SET email = COALESCE($1, email), role = COALESCE($2, role), updated_at = NOW()';
    const params = [email || null, role || null];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      params.push(hashedPassword);
      query += `, password = $${params.length}`;
    }

    params.push(id);
    query += ` WHERE id = $${params.length} RETURNING id, username, email, role, updated_at`;

    const result = await pool.query(query, params);
    return res.json({ success: true, message: 'User updated successfully.', data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to update user.', error: err.message });
  }
}

/**
 * Delete user
 */
async function deleteUser(req, res) {
  const { id } = req.params;

  if (parseInt(id) === req.user?.id) {
    return res.status(400).json({ success: false, message: 'Cannot delete your own active account.' });
  }

  try {
    const countRes = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(countRes.rows[0].count) <= 1) {
      return res.status(400).json({ success: false, message: 'Cannot delete the last remaining user.' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, message: 'User deleted successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to delete user.', error: err.message });
  }
}

module.exports = {
  listUsers,
  createUser,
  updateUser,
  deleteUser
};
