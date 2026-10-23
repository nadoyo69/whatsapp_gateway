// Read-only health check of one stored WhatsApp session folder. It changes nothing and never
// prints keys or secrets (only counts, sizes, dates and a masked phone number).
//
//   docker compose exec -T -e SESSION_ID=bukunadoyo_1 wa-backend node - < scripts/inspect-session.js

const fs = require('node:fs');
const path = require('node:path');

const sessionId = process.env.SESSION_ID;
const root = process.env.SESSIONS_PATH || '/app/sessions';
if (!sessionId) {
  console.error('Set SESSION_ID, for example: -e SESSION_ID=bukunadoyo_1');
  process.exit(1);
}

const dir = path.join(root, sessionId);
if (!fs.existsSync(dir)) {
  console.log(`FAIL folder not found: ${dir}`);
  console.log('Available session folders:', fs.existsSync(root) ? fs.readdirSync(root).join(', ') || '(none)' : '(sessions path missing)');
  process.exit(0);
}

const files = fs.readdirSync(dir).map((name) => ({ name, stat: fs.statSync(path.join(dir, name)) }));
const ago = (date) => {
  const minutes = Math.round((Date.now() - date.getTime()) / 60000);
  return minutes < 90 ? `${minutes} min ago` : minutes < 2880 ? `${Math.round(minutes / 60)} h ago` : `${Math.round(minutes / 1440)} days ago`;
};

console.log(`Folder : ${dir}`);
console.log(`Files  : ${files.length}, total ${(files.reduce((n, f) => n + f.stat.size, 0) / 1024).toFixed(0)} KB`);
const newest = files.reduce((a, b) => (a.stat.mtime > b.stat.mtime ? a : b), files[0]);
if (newest) console.log(`Newest : ${newest.name} modified ${ago(newest.stat.mtime)}`);

// 1. every JSON file must parse and be non-empty (a crash mid-write leaves a truncated file)
const broken = [];
const byType = {};
for (const { name, stat } of files) {
  const type = name.startsWith('app-state-sync-key') ? 'app-state-sync-key'
    : name.startsWith('app-state-sync-version') ? 'app-state-sync-version'
      : name.startsWith('pre-key') ? 'pre-key'
        : name.startsWith('session-') ? 'session'
          : name.startsWith('sender-key') ? 'sender-key'
            : name.startsWith('lid-mapping') ? 'lid-mapping'
              : name === 'creds.json' ? 'creds' : 'other';
  byType[type] = (byType[type] || 0) + 1;
  try {
    if (stat.size === 0) throw new Error('empty file');
    JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
  } catch (e) {
    broken.push(`${name} (${e.message})`);
  }
}
console.log('Types  :', Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(', '));
console.log(broken.length ? `FAIL ${broken.length} unreadable file(s): ${broken.slice(0, 8).join('; ')}` : 'OK   all JSON files are readable');

// 2. what creds.json says about the registration
const credsPath = path.join(dir, 'creds.json');
if (!fs.existsSync(credsPath)) {
  console.log('FAIL creds.json is missing: Baileys will create a new, unlinked session (a QR is needed).');
  process.exit(0);
}
let creds;
try { creds = JSON.parse(fs.readFileSync(credsPath, 'utf8')); } catch (e) { console.log(`FAIL creds.json cannot be parsed: ${e.message}`); process.exit(0); }

const me = creds.me && creds.me.id ? String(creds.me.id) : null;
const phone = me ? me.split('@')[0].split(':')[0] : null;
console.log(`creds  : registered=${creds.registered} | linked account=${phone ? `...${phone.slice(-4)}` : 'none'} | platform=${creds.platform || '-'}`);
console.log(`         signedPreKey=${creds.signedPreKey ? 'yes' : 'NO'} | noiseKey=${creds.noiseKey ? 'yes' : 'NO'} | advSecretKey=${creds.advSecretKey ? 'yes' : 'NO'} | nextPreKeyId=${creds.nextPreKeyId}`);
console.log(`         creds.json modified ${ago(fs.statSync(credsPath).mtime)}`);

console.log('\nReading:');
if (!me) {
  console.log('- No linked account in creds.json: this folder is an UNLINKED session, so it needs a QR scan.');
} else if (broken.length) {
  console.log('- The account is linked but some files are unreadable (corrupted). Login can hang until the folder is repaired or re-linked.');
} else {
  console.log('- The account is linked and every file is readable. Login failing with 408 then points at WhatsApp/the phone side');
  console.log('  (device removed or limited on the phone, or another instance connected with the same credentials).');
}
