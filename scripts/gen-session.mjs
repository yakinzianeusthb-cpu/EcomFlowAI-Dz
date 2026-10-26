// Dev helper: print a valid dzads_session cookie for a given user.
// Usage: node scripts/gen-session.mjs <user-id> <email> <name>
// The cookie is signed with SESSION_SECRET (a development default is used outside production) and expires in 30 days,
// like the ones the server issues.
import 'dotenv/config';
import crypto from 'crypto';

const [sub, email, name] = process.argv.slice(2);
if (!sub || !email || !name) {
  console.error('Usage: node scripts/gen-session.mjs <user-id> <email> <name>');
  process.exit(1);
}

const secret = process.env.SESSION_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'dzads-dev-session-secret');
if (!secret) {
  console.error('SESSION_SECRET is required in production.');
  process.exit(1);
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const body = Buffer.from(JSON.stringify({ sub, email, name, exp: Date.now() + THIRTY_DAYS_MS })).toString('base64url');
const sig = crypto.createHmac('sha256', secret).update(body).digest('base64url');
console.log(`${body}.${sig}`);
