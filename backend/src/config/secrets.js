// Credentials that were once shipped as defaults in this repository. They are public,
// so they must never be accepted as real secrets.
const PUBLISHED_DEFAULTS = new Set([
  'admin123',
  'wa_secret_123',
  'wa_secret_123_change_this_in_production',
  'wa_secret_token_default_key_2026',
  'wa_super_secret_jwt_key_2026',
  'wa_super_secret_jwt_key_2026_change_this_in_production',
  'wa_gateway_super_jwt_secret_key_2026',
]);

/**
 * Read a required secret from the environment and fail fast when it is missing,
 * still a placeholder, or (optionally) one of the previously published defaults.
 */
function requireEnv(name, { minLength = 1, rejectPublished = true } = {}) {
  const value = process.env[name];

  if (!value || !value.trim()) {
    throw new Error(`Missing required environment variable ${name}. Copy .env.example to .env and set a strong value.`);
  }
  if (/^CHANGE_ME/i.test(value)) {
    throw new Error(`Environment variable ${name} still holds the placeholder from .env.example. Set a strong value.`);
  }
  if (rejectPublished && PUBLISHED_DEFAULTS.has(value)) {
    throw new Error(`Environment variable ${name} uses a publicly known default value. Generate a new one.`);
  }
  if (value.length < minLength) {
    throw new Error(`Environment variable ${name} must be at least ${minLength} characters long.`);
  }
  return value;
}

module.exports = { requireEnv };
