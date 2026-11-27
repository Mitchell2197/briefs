// Runs in GitHub Actions after a brief lands. Sends one web push per changed brief.
// Env: VAPID_PUBLIC, VAPID_PRIVATE, VAPID_SUBJECT, PUSH_SUBSCRIPTIONS (JSON array), CHANGED (space-separated paths)
import { readFileSync, existsSync } from 'node:fs';
import webpush from 'web-push';

const subs = JSON.parse(process.env.PUSH_SUBSCRIPTIONS || '[]');
if (!subs.length) { console.log('No subscriptions saved yet; nothing to send.'); process.exit(0); }
webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:briefs@example.com',
  process.env.VAPID_PUBLIC, process.env.VAPID_PRIVATE);

const changed = (process.env.CHANGED || '').split(/\s+/).filter(p => /^data\/(daily|gym|inbox)\.json$/.test(p) && existsSync(p));
let failed = 0;
for (const path of changed) {
  const env = JSON.parse(readFileSync(path, 'utf8'));
  const payload = JSON.stringify({
    title: env.notify?.title || 'New brief',
    body: env.notify?.body || '',
    url: './#' + env.kind,
    tag: env.kind
  });
  for (const sub of subs) {
    try { await webpush.sendNotification(sub, payload, { TTL: 60 * 60 * 12 }); console.log('sent', env.kind); }
    catch (err) { failed++; console.error('push failed', env.kind, err.statusCode, err.body); }
  }
}
if (!changed.length) console.log('No brief files changed.');
if (failed) process.exit(1);
