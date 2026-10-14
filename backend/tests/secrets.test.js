const test = require('node:test');
const assert = require('node:assert/strict');
const { requireEnv } = require('../src/config/secrets');

const NAME = 'WA_TEST_SECRET';

function withEnv(value, fn) {
  const previous = process.env[NAME];
  if (value === undefined) delete process.env[NAME];
  else process.env[NAME] = value;
  try {
    return fn();
  } finally {
    if (previous === undefined) delete process.env[NAME];
    else process.env[NAME] = previous;
  }
}

test('requireEnv returns a strong value unchanged', () => {
  assert.equal(withEnv('a-strong-random-value-123', () => requireEnv(NAME)), 'a-strong-random-value-123');
});

test('requireEnv rejects missing and blank values', () => {
  assert.throws(() => withEnv(undefined, () => requireEnv(NAME)), /Missing required environment variable/);
  assert.throws(() => withEnv('   ', () => requireEnv(NAME)), /Missing required environment variable/);
});

test('requireEnv rejects .env.example placeholders', () => {
  assert.throws(() => withEnv('CHANGE_ME_jwt_secret', () => requireEnv(NAME)), /placeholder/);
});

test('requireEnv rejects previously published defaults', () => {
  assert.throws(() => withEnv('admin123', () => requireEnv(NAME)), /publicly known/);
  assert.throws(() => withEnv('wa_secret_token_default_key_2026', () => requireEnv(NAME)), /publicly known/);
});

test('requireEnv can skip the published-default check', () => {
  assert.equal(withEnv('wa_secret_123', () => requireEnv(NAME, { rejectPublished: false })), 'wa_secret_123');
});

test('requireEnv enforces the minimum length', () => {
  assert.throws(() => withEnv('short', () => requireEnv(NAME, { minLength: 32 })), /at least 32/);
});
