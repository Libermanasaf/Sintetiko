/**
 * One-off: send the "אתה בפנים ✅" push to specific approved stand-by players who
 * didn't receive it. Mirrors api/send-notification.js exactly (web-push + the
 * push_subscriptions matched by user_email) but runs locally with the service
 * role key, so it doesn't need an admin JWT.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/send-standby-push.cjs            (dry run)
 *   SUPABASE_SERVICE_ROLE_KEY=... node scripts/send-standby-push.cjs --apply
 */
const fs = require('fs');
const path = require('path');
const webpush = require('web-push');
const { createClient } = require('@supabase/supabase-js');

const APPLY = process.argv.includes('--apply');

// --- config from .env (URL + VAPID) + service role from process env ---
let SUPABASE_URL = '', VAPID_PRIVATE = '', VAPID_PUBLIC = '';
for (const line of fs.readFileSync(path.join(__dirname, '../.env'), 'utf8').split('\n')) {
  const t = line.trim();
  if (t.startsWith('VITE_SUPABASE_URL=')) SUPABASE_URL = t.split('=').slice(1).join('=').trim();
  if (t.startsWith('VAPID_PRIVATE_KEY=')) VAPID_PRIVATE = t.split('=').slice(1).join('=').trim();
  if (t.startsWith('VITE_VAPID_PUBLIC_KEY=')) VAPID_PUBLIC = t.split('=').slice(1).join('=').trim();
}
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY || !VAPID_PRIVATE || !VAPID_PUBLIC) {
  console.error('Missing config (URL/SERVICE_ROLE_KEY/VAPID).');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
webpush.setVapidDetails('mailto:libermanasaf@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

// Players to notify: name is for the message body, email matches push_subscriptions.
const TARGETS = [
  { name: 'בר ממן',   email: 'kintarobar1@gmail.com', day: 'יום חמישי' },
  { name: 'ניב מזרחי', email: 'niv@ktesoro.com',       day: 'יום חמישי' },
];

async function main() {
  for (const tgt of TARGETS) {
    const { data: subs, error } = await supabase
      .from('push_subscriptions').select('*').eq('user_email', tgt.email.toLowerCase());
    if (error) { console.error(tgt.name, 'query error:', error.message); continue; }

    const payload = JSON.stringify({
      title: 'סינתטיקו חולון — אתה בפנים! ✅',
      body: `${tgt.name}, הגעתך ל${tgt.day} אושרה`,
      url: '/',
    });

    console.log(`\n${tgt.name} <${tgt.email}> — ${subs.length} subscription(s)`);
    if (!APPLY) { console.log('  (dry run — not sending)'); continue; }

    let sent = 0, failed = 0;
    for (const row of subs) {
      try { await webpush.sendNotification(row.subscription, payload); sent++; }
      catch (err) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
          console.log('  removed expired sub');
        } else {
          console.log('  send error:', err.statusCode, err.body || err.message);
        }
      }
    }
    console.log(`  sent=${sent} failed=${failed}`);
  }
}

main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
