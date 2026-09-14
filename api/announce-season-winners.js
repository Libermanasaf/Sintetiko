import webpush from 'web-push';
import { getSupabaseAdmin } from './_supabaseAdmin.js';
import { getRestrictedEmails, withoutRestricted } from './_restrictedEmails.js';
import { VAPID_PUBLIC_KEY } from '../src/lib/vapidPublic.js';

const AWARD_ID = '2026';

// Category order for the announcement. Only these are announced.
const CATEGORIES = [
  { key: 'player',       label: 'שחקן העונה' },
  { key: 'breakthrough', label: 'הגילוי של העונה' },
];

// Third, second, first — the reveal order, as it would be read out on stage.
const PLACES = [
  { index: 2, emoji: '🥉', word: 'המקום השלישי' },
  { index: 1, emoji: '🥈', word: 'המקום השני' },
  { index: 0, emoji: '🏆', word: 'הזוכה' },
];

// A minute between places, so each lands as its own moment. Trimmed slightly
// below 60s: 6 places means 5 gaps, and at a flat 60s the gaps alone consume
// the entire 300s budget, leaving nothing for the sends — the final push (the
// winner) would be cut off.
const GAP_MS = 55_000;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Six places a minute apart takes ~5 minutes of wall clock, so the default
// timeout would kill the run partway and the winner would never be announced.
// 300s is the Hobby-plan ceiling; the last gap is skipped anyway, so the run
// is 5 gaps = 300s minus the send time. Keep GAP_MS * (places - 1) under this.
export const config = { maxDuration: 300 };

// Announces the season winners: one push per place, third to first.
//
// Publishes the results first (results_shown), because a push naming a winner
// must never point at a page that still says "not published yet".
//
// Idempotent: it refuses once results_shown is set, so a cron retry or a second
// call cannot announce the winners twice.
//
//   ?dry=1   report what would be sent, send nothing
//   ?force=1 announce even if the vote is somehow still open
export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || '';
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const dry = req.query?.dry === '1';
  const forced = req.query?.force === '1';

  const supabase = getSupabaseAdmin();
  if (!supabase || !supabase.__isServiceRole) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' });
  }

  const { data: award, error: aErr } = await supabase
    .from('season_awards')
    .select('id, title, is_open, results_shown')
    .eq('id', AWARD_ID)
    .maybeSingle();
  if (aErr) return res.status(500).json({ error: aErr.message });
  if (!award) return res.status(404).json({ error: 'no such award' });

  // Already announced — do not repeat it to the whole club.
  if (award.results_shown) {
    return res.status(200).json({ ok: true, skipped: 'already announced' });
  }

  // Never announce while people can still vote.
  if (award.is_open && !forced) {
    return res.status(200).json({ ok: true, skipped: 'voting still open' });
  }

  // Tally directly: the RPC gates on results_shown, which is still false here.
  const { data: votes, error: vErr } = await supabase
    .from('season_award_votes')
    .select('category, candidate_id')
    .eq('award_id', AWARD_ID);
  if (vErr) return res.status(500).json({ error: vErr.message });

  const { data: players } = await supabase.from('players').select('id, name');
  const nameById = new Map((players || []).map((p) => [p.id, p.name]));

  const ranked = {};
  for (const c of CATEGORIES) {
    const counts = new Map();
    for (const v of votes || []) {
      if (v.category !== c.key) continue;
      counts.set(v.candidate_id, (counts.get(v.candidate_id) || 0) + 1);
    }
    ranked[c.key] = [...counts.entries()]
      .map(([id, n]) => ({ id, name: nameById.get(id) || 'שחקן', votes: n }))
      .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name, 'he'));
  }

  // Build the messages in reveal order: for each category, 3rd then 2nd then 1st.
  const messages = [];
  for (const c of CATEGORIES) {
    const rows = ranked[c.key];
    if (!rows.length) continue;
    for (const place of PLACES) {
      const row = rows[place.index];
      if (!row) continue; // fewer than three candidates received votes
      messages.push({
        title: `${place.emoji} ${c.label} — ${place.word}`,
        body: `${row.name} · ${row.votes} קולות`,
        tag: `season-${AWARD_ID}-${c.key}-${place.index}`,
      });
    }
  }

  if (!messages.length) {
    return res.status(200).json({ ok: true, skipped: 'no votes to announce' });
  }

  if (dry) {
    return res.status(200).json({ ok: true, dry: true, messages });
  }

  // Publish BEFORE notifying, so every push points at a page that already
  // shows the results.
  const { error: uErr } = await supabase
    .from('season_awards').update({ results_shown: true }).eq('id', AWARD_ID);
  if (uErr) return res.status(500).json({ error: uErr.message });

  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  if (!VAPID_PRIVATE) {
    return res.status(200).json({ ok: true, published: true, sent: 0, note: 'VAPID_PRIVATE_KEY missing' });
  }
  webpush.setVapidDetails('mailto:libermanasaf@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE);

  const { data: subs } = await supabase.from('push_subscriptions').select('*');
  const restricted = await getRestrictedEmails(supabase);
  const recipients = withoutRestricted(subs, restricted);

  let sent = 0, failed = 0;
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    const payload = JSON.stringify({
      title: m.title,
      body: m.body,
      url: '/SeasonCeremony',
      // A distinct tag per place, otherwise a phone collapses them into one.
      tag: m.tag,
    });
    await Promise.all((recipients || []).map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
        sent++;
      } catch (err) {
        failed++;
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
        }
      }
    }));
    if (i < messages.length - 1) await sleep(GAP_MS);
  }

  return res.status(200).json({
    ok: true, published: true, places: messages.length, sent, failed,
  });
}
