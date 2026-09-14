import webpush from 'web-push';
import { getSupabaseAdmin } from './_supabaseAdmin.js';
import { getRestrictedEmails, withoutRestricted } from './_restrictedEmails.js';
import { VAPID_PUBLIC_KEY } from '../src/lib/vapidPublic.js';

const AWARD_ID = '2026';

// Locks the season vote and tells everyone it closed.
//
// The DB is already the real lock: cast_season_vote refuses once closes_at has
// passed, so a missed or late run cannot let a vote through. This endpoint
// flips is_open (so the UI agrees with the server) and sends the push.
//
// Idempotent: if the award is already closed it sends nothing, so re-running —
// by cron retry or a second click — cannot double-notify the club.
//
//   ?dry=1   report what would happen, send nothing
//   ?force=1 close now even if closes_at is still in the future
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
    .select('id, title, is_open, closes_at, results_shown')
    .eq('id', AWARD_ID)
    .maybeSingle();
  if (aErr) return res.status(500).json({ error: aErr.message });
  if (!award) return res.status(404).json({ error: 'no such award' });

  // Already closed — nothing to do, and above all no second push.
  if (!award.is_open) {
    return res.status(200).json({ ok: true, skipped: 'already closed' });
  }

  // Only close once the deadline has actually passed, unless forced.
  if (!forced && award.closes_at && new Date(award.closes_at) > new Date()) {
    return res.status(200).json({
      ok: true,
      skipped: 'deadline not reached',
      closes_at: award.closes_at,
    });
  }

  const { count: voters } = await supabase
    .from('season_award_votes')
    .select('voter_id', { count: 'exact', head: true })
    .eq('award_id', AWARD_ID);

  if (dry) {
    return res.status(200).json({ ok: true, dry: true, wouldClose: true, votes: voters ?? 0 });
  }

  const { error: uErr } = await supabase
    .from('season_awards')
    .update({ is_open: false })
    .eq('id', AWARD_ID);
  if (uErr) return res.status(500).json({ error: uErr.message });

  // Push after the close is saved, so a notification never announces a lock
  // that did not happen.
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  let sent = 0, failed = 0;
  if (VAPID_PRIVATE) {
    webpush.setVapidDetails('mailto:libermanasaf@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE);

    const { data: subs } = await supabase.from('push_subscriptions').select('*');
    const restricted = await getRestrictedEmails(supabase);
    const recipients = withoutRestricted(subs, restricted);

    const payload = JSON.stringify({
      title: 'ההצבעה לנבחרי העונה ננעלה 🔒',
      body: 'ההצבעה הסתיימה. התוצאות ייחשפו בטקס נבחרי העונה 🏆',
      url: '/SeasonCeremony',
      tag: `season-closed-${AWARD_ID}`,
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
  }

  return res.status(200).json({ ok: true, closed: true, votes: voters ?? 0, sent, failed });
}
