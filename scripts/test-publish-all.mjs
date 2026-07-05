// Test: create fictional round → fire push to ALL subscribed users (simulates "פרסם").
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const env = readFileSync(path.resolve(__dirname, '..', '.env'), 'utf8');
const get = (k) => env.split('\n').find((l) => l.startsWith(`${k}=`))?.split('=')[1]?.trim().replace(/^["']|["']$/g, '');
const sb = createClient(get('VITE_SUPABASE_URL'), get('VITE_SUPABASE_ANON_KEY'));

const DEPLOY_URL = 'https://sintetiko.vercel.app';

// 1. List all subscriptions
console.log('[1] All push subscriptions in DB...');
const { data: allSubs, error: subsErr } = await sb
  .from('push_subscriptions')
  .select('endpoint, user_email, updated_at');
if (subsErr) throw subsErr;
if (!allSubs?.length) {
  console.error('   ✗ No subscriptions found. Users need to enable notifications first.');
  process.exit(1);
}
console.log(`   ✓ ${allSubs.length} subscription(s):`);
for (const s of allSubs) {
  console.log(`     · ${s.user_email || '(anonymous)'} — updated ${new Date(s.updated_at).toLocaleString('he-IL')}`);
}

// 2. Create fictional round
console.log('\n[2] Creating fictional round...');
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

// 3. Fire push to ALL users (no targetEmail — same as clicking "פרסם")
console.log('\n[3] Sending push to ALL subscribed users...');
const res = await fetch(`${DEPLOY_URL}/api/send-notification`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: '⚽ פורסמו הרכבים!',
    body: 'הרכבי המחזור החדש מוכנים — לחץ לצפייה',
    url: '/MatchDay',
  }),
});
const result = await res.json().catch(() => ({}));
console.log(`   HTTP ${res.status}: ${JSON.stringify(result)}`);

if (res.ok && result.sent > 0) {
  console.log(`\n✓ SUCCESS — push sent to ${result.sent} device(s), ${result.failed} failed`);
} else if (res.ok && result.failed > 0) {
  console.log(`\n⚠ ${result.failed} push attempt(s) failed — subscriptions may have expired.`);
} else if (!res.ok) {
  console.error(`\n✗ API error ${res.status}.`);
}

console.log(`\nTest round id (delete when done): ${roundId}`);
process.exit(0);
