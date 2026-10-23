const test = require('node:test');
const assert = require('node:assert/strict');
const net = require('node:net');

test('happy-eyeballs attempt timeout is raised well above the 250 ms Node default', () => {
  const { ATTEMPT_TIMEOUT_MS } = require('../src/config/network');
  assert.ok(ATTEMPT_TIMEOUT_MS >= 2000, 'must tolerate a ~1 s first packet');
  assert.equal(net.getDefaultAutoSelectFamilyAttemptTimeout(), ATTEMPT_TIMEOUT_MS);
});
