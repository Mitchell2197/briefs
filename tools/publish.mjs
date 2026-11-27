// Encrypt a brief and write it to data/<kind>.json for the app.
// Usage: BRIEFS_KEY='passphrase' node tools/publish.mjs <daily|gym|inbox> <brief.json> "<push title>" "<push body>"
// The push title/body are stored UNENCRYPTED so the notifier can send them. Keep them free of private details.
import { readFileSync, writeFileSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const [kind, file, title = '', body = ''] = process.argv.slice(2);
const KINDS = ['daily', 'gym', 'inbox'];
const pass = process.env.BRIEFS_KEY;
if (!KINDS.includes(kind) || !file || !pass) {
  console.error('Usage: BRIEFS_KEY=... node tools/publish.mjs <daily|gym|inbox> <brief.json> "<title>" "<body>"');
  process.exit(1);
}
const data = JSON.parse(readFileSync(file, 'utf8')); // throws on invalid JSON
const plain = new TextEncoder().encode(JSON.stringify(data));
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(pass), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 310000, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plain));
const b64 = u => Buffer.from(u).toString('base64');
const names = { daily: 'Daily Brief', gym: 'Gym Brief', inbox: 'Inbox Brief' };
const env = {
  v: 1, kind, updated: new Date().toISOString(),
  notify: { title: (title || names[kind]).slice(0, 80), body: body.slice(0, 240) },
  salt: b64(salt), iv: b64(iv), ct: b64(ct)
};
const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'data', kind + '.json');
writeFileSync(out, JSON.stringify(env) + '\n');
console.log('wrote', out);
