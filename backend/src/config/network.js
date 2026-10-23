const net = require('net');

// Node connects to a hostname's addresses "happy eyeballs" style and, by default, gives each
// attempt only 250 ms before abandoning it for the next address. On a server with no IPv6
// route and a slow first packet (NAT/firewall; a new connection takes ~1 s), the only usable
// IPv4 attempt is abandoned at 250 ms, the IPv6 attempt fails instantly (ENETUNREACH), and the
// connection dies with an AggregateError whose message is empty. Baileys reports that as
// "WebSocket Error () / status 408", and the GitHub version lookup fails with ETIMEDOUT.
const ATTEMPT_TIMEOUT_MS = 5000;

if (typeof net.setDefaultAutoSelectFamilyAttemptTimeout === 'function') {
  net.setDefaultAutoSelectFamilyAttemptTimeout(ATTEMPT_TIMEOUT_MS);
}

module.exports = { ATTEMPT_TIMEOUT_MS };
