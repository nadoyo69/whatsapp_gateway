const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { requireEnv } = require('./secrets');

// Existing deployments keep their PostgreSQL volume (and its password), so the
// password is required but not checked against the published defaults.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || `postgresql://${encodeURIComponent(process.env.DB_USER || 'wa_admin')}:${encodeURIComponent(requireEnv('DB_PASSWORD', { rejectPublished: false }))}@${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'wa_gateway_db'}`
});

async function initPostgres() {
  const client = await pool.connect();
  try {
    // 1. Table Users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        email VARCHAR(150) UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Table API Tokens
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_tokens (
        id SERIAL PRIMARY KEY,
        name VARCHAR(150) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        is_active BOOLEAN DEFAULT TRUE,
        last_used_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 3. Table Devices / WA Sessions
    await client.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        phone_number VARCHAR(50),
        status VARCHAR(50) DEFAULT 'disconnected',
        webhook_url TEXT,
        webhook_secret VARCHAR(255),
        auto_read BOOLEAN DEFAULT FALSE,
        api_token_id INTEGER REFERENCES api_tokens(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS api_token_id INTEGER REFERENCES api_tokens(id) ON DELETE SET NULL;
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS store_messages BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS download_media BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE devices ADD COLUMN IF NOT EXISTS webhook_retry BOOLEAN NOT NULL DEFAULT FALSE;
      CREATE INDEX IF NOT EXISTS idx_devices_api_token ON devices(api_token_id);
    `);

    // 4. Table Settings
    await client.query(`
      CREATE TABLE IF NOT EXISTS settings (
        key VARCHAR(100) PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 5. Table API Usage Logs (Per API Key & Per Device analytics)
    await client.query(`
      CREATE TABLE IF NOT EXISTS api_usage_logs (
        id BIGSERIAL PRIMARY KEY,
        api_token_id INTEGER REFERENCES api_tokens(id) ON DELETE SET NULL,
        session_id VARCHAR(100),
        endpoint VARCHAR(255) NOT NULL,
        method VARCHAR(10) NOT NULL,
        status_code INTEGER NOT NULL,
        response_time_ms INTEGER DEFAULT 0,
        ip_address VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_api_usage_token ON api_usage_logs(api_token_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_session ON api_usage_logs(session_id);
      CREATE INDEX IF NOT EXISTS idx_api_usage_created ON api_usage_logs(created_at);
    `);

    // Seed default Admin user if empty
    const userRes = await client.query('SELECT COUNT(*) FROM users');
    if (parseInt(userRes.rows[0].count) === 0) {
      const defaultUsername = process.env.ADMIN_DEFAULT_USER || 'admin';
      const defaultPassword = requireEnv('ADMIN_DEFAULT_PASS', { minLength: 8 });
      const defaultEmail = process.env.ADMIN_DEFAULT_EMAIL || 'admin@wagenerator.local';
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      
      const insertAdmin = await client.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id',
        [defaultUsername, defaultEmail, hashedPassword, 'admin']
      );

      // Seed the initial master API token
      const defaultToken = requireEnv('DEFAULT_API_TOKEN', { minLength: 24 });
      await client.query(
        'INSERT INTO api_tokens (name, token, user_id) VALUES ($1, $2, $3)',
        ['Default Master Key', defaultToken, insertAdmin.rows[0].id]
      );
      
      console.log(`[PostgreSQL] Initialized with default admin: "${defaultUsername}" and a master API token.`);
    } else {
      console.log('[PostgreSQL] Database tables initialized successfully.');
    }
  } catch (err) {
    console.error('[PostgreSQL] Database initialization error:', err.message);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { pool, initPostgres };
