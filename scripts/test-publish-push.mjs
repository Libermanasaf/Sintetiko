// One-off: check push setup → create a fictional round → fire push only to admin.
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = readFileSync(path.resolve(__dirname, '..', '.env'), 'utf8');
const get = (k) => env.split('\n').find((l) => l.startsWith(`${k}=`))?.split('=')[1]?.trim().replace(/^["']|["']$/g, '');
const sb = createClient(get('VITE_SUPABASE_URL'), get('VITE_SUPABASE_ANON_KEY'));

const ADMIN_EMAIL = 'libermanasaf@gmail.com';
const DEPLOY_URL = 'https://sintetiko.vercel.app';

// 1. push_subscriptions table?
console.log('[1] push_subscriptions table check...');
const { error: probeErr } = await sb.from('push_subscriptions').select('endpoint').limit(1);
if (probeErr && /does not exist|schema cache/i.test(probeErr.message)) {
  console.error('   ✗ Table does not exist. Run the SQL migration in Supabase first.');
  process.exit(1);
}
console.log('   ✓ Table exists');

// 2. Admin subscription?
console.log(`\n[2] Subscription for ${ADMIN_EMAIL}...`);
const { data: subs, error: subsErr } = await sb
  .from('push_subscriptions')
  .select('endpoint, user_email, updated_at')
  .eq('user_email', ADMIN_EMAIL);
if (subsErr) throw subsErr;
if (!subs?.length) {
  console.error('   ✗ No subscription found.');
  console.error('     Open sintetiko.vercel.app on your phone → אבחון התראות → אפשר התראות');
  process.exit(1);
}
console.log(`   ✓ ${subs.length} subscription(s) found`);
for (const s of subs) console.log(`     · updated ${new Date(s.updated_at).toLocaleString('he-IL')}`);

// 3. Create the fictional round
console.log('\n[3] Creating fictional round...');
const { data: players } = await sb.from('players').select('id, name').order('name').limit(18);
const teams = [players.slice(0, 6).map(p => p.id), players.slice(6, 12).map(p => p.id), players.slice(12, 18).map(p => p.id)];
const roundId = randomUUID();
const date = new Date(); date.setHours(20, 0, 0, 0);
const { error: rErr } = await sb.from('rounds').insert({
  id: roundId,
  date: date.toISOString(),
  teams,
  openingTeams: [0, 1],
  winningTeam: null,
  teamWins: null,
  victoryPhoto: null,
  player_goals: {},
});
if (rErr) throw rErr;
console.log(`   ✓ Round created · id=${roundId}`);

// 4. Fire push targeted at admin only
console.log('\n[4] Firing push targeted at admin only...');
const res = await fetch(`${DEPLOY_URL}/api/send-notification`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    targetEmail: ADMIN_EMAIL,
    title: '⚽ פורסמו הרכבים!',
    body: 'הרכבי המחזור החדש מוכנים — לחץ לצפייה',
    url: '/MatchDay',
  }),
});
const result = await res.json().catch(() => ({}));
console.log(`   HTTP ${res.status}: ${JSON.stringify(result)}`);

if (res.ok && result.sent > 0) {
  console.log(`\n✓ SUCCESS — push sent to ${result.sent} device(s)`);
} else if (res.ok && result.failed > 0) {
  console.log(`\n⚠ ${result.failed} push attempt(s) failed — subscription may have expired.`);
} else if (!res.ok) {
  console.error(`\n✗ API error ${res.status}. Likely VAPID_PRIVATE_KEY missing on Vercel.`);
}

console.log(`\nTest round id (to delete later): ${roundId}`);
process.exit(0);
