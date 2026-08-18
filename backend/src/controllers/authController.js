const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/postgres');
const { JWT_SECRET } = require('../middlewares/auth');

// In-memory CAPTCHA store with 5 minutes TTL
const captchaStore = new Map();

// Periodic cleanup of expired captchas every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, item] of captchaStore.entries()) {
    if (item.expiresAt < now) {
      captchaStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

/**
 * Generate a new Math calculation CAPTCHA
 */
function getCaptcha(req, res) {
  const ops = ['+', '-', '×'];
  const op = ops[Math.floor(Math.random() * ops.length)];

  let num1, num2, answer;

  if (op === '+') {
    num1 = Math.floor(Math.random() * 20) + 1;
    num2 = Math.floor(Math.random() * 20) + 1;
    answer = num1 + num2;
  } else if (op === '-') {
    num1 = Math.floor(Math.random() * 25) + 10;
    num2 = Math.floor(Math.random() * (num1 - 1)) + 1;
    answer = num1 - num2;
  } else {
    num1 = Math.floor(Math.random() * 9) + 2;
    num2 = Math.floor(Math.random() * 9) + 2;
    answer = num1 * num2;
  }

  const captchaKey = crypto.randomBytes(16).toString('hex');
  captchaStore.set(captchaKey, {
    answer: String(answer),
    expiresAt: Date.now() + 5 * 60 * 1000 // 5 minutes validity
  });

  return res.json({
    success: true,
    data: {
      captchaKey,
      question: `${num1} ${op} ${num2} = ?`
    }
  });
}

async function login(req, res) {
  const { username, password, captchaKey, captchaAnswer } = req.body;

  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Username and password are required.' });
  }

  // Verify Math CAPTCHA
  if (!captchaKey || captchaAnswer === undefined || captchaAnswer === null || String(captchaAnswer).trim() === '') {
    return res.status(400).json({ success: false, message: 'Math calculation CAPTCHA answer is required.' });
  }

  const storedCaptcha = captchaStore.get(captchaKey);
  if (!storedCaptcha || storedCaptcha.expiresAt < Date.now()) {
    captchaStore.delete(captchaKey);
    return res.status(400).json({ success: false, message: 'CAPTCHA expired. Please refresh and try again.' });
  }

  if (String(captchaAnswer).trim() !== storedCaptcha.answer) {
    captchaStore.delete(captchaKey);
    return res.status(400).json({ success: false, message: 'Incorrect CAPTCHA calculation answer.' });
  }

  // Consume CAPTCHA key to prevent replay
  captchaStore.delete(captchaKey);

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      success: true,
      message: 'Login successful.',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error during login.', error: err.message });
  }
}

async function me(req, res) {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    return res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving user profile.', error: err.message });
  }
}

async function changePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Old and new passwords are required.' });
  }

  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const user = result.rows[0];

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Current password does not match.' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2', [hashedNew, req.user.id]);

    return res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating password.', error: err.message });
  }
}

module.exports = {
  getCaptcha,
  login,
  me,
  changePassword
};
