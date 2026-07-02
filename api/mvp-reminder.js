import webpush from 'web-push';
import { getSupabaseAdmin } from './_supabaseAdmin.js';
import { VAPID_PUBLIC_KEY } from '../src/lib/vapidPublic.js';

// Lowercased to match subsByEmail keys (which are lowercased on insert below).
const ADMIN_EMAIL = 'libermanasaf@gmail.com';

// Daily cron: remind players who PLAYED in a just-closed round but haven't yet
// voted for the MVP, to go pick tonight's best player. Sends exactly ONE push
// per player per round (tracked in rounds.mvpReminded) — never nags again.
//
// Runs via Vercel Cron (see vercel.json). Vercel sets an Authorization header
// with CRON_SECRET on scheduled invocations; we require it so the endpoint
// can't be triggered by outsiders to blast pushes.
export default async function handler(req, res) {
  // Auth: allow Vercel Cron (Bearer CRON_SECRET) only. If CRON_SECRET isn't set,
  // fall back to allowing GET so a manual test still works, but log loudly.
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || '';
  if (cronSecret) {
    if (auth !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'unauthorized' });
    }
  } else {
    console.warn('[mvp-reminder] CRON_SECRET not set — endpoint is unauthenticated');
  }

  // Only send around noon Israel time. The cron fires at 09:00 UTC (= 12:00 in
  // summer, 11:00 in winter); this guard keeps it near local noon year-round and
  // stops a manual/mis-timed hit from pushing at 3am. Bypass with ?force=1.
  const israelHour = Number(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Jerusalem', hour: 'numeric', hour12: false,
    }).format(new Date())
  );
  const forced = req.query?.force === '1';
  if (!forced && (israelHour < 11 || israelHour > 13)) {
    return res.status(200).json({ ok: true, skipped: 'outside Israel noon window', israelHour });
  }

  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  if (!VAPID_PRIVATE) {
    return res.status(500).json({ error: 'VAPID_PRIVATE_KEY not configured' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase || !supabase.__isServiceRole) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing — cannot read subscriptions/rounds under RLS' });
  }

  webpush.setVapidDetails('mailto:libermanasaf@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE);

  // Closed rounds whose 48h voting window is still open.
  const nowMs = Date.now();
  const windowMs = 48 * 60 * 60 * 1000;
  const { data: rounds, error: rErr } = await supabase
    .from('rounds')
    .select('id, date, teams, mvpVoters, mvpReminded, closed_at, is_closed')
    .eq('is_closed', true)
    .not('closed_at', 'is', null);
  if (rErr) return res.status(500).json({ error: rErr.message });

  const openRounds = (rounds || []).filter((r) => {
    const closedAt = new Date(r.closed_at).getTime();
    return nowMs < closedAt + windowMs; // still inside the voting window
  });

  if (openRounds.length === 0) {
    return res.status(200).json({ ok: true, rounds: 0, sent: 0 });
  }

  // Map player id -> email once (only players who have an email).
  const { data: playersRows, error: pErr } = await supabase
    .from('players')
    .select('id, name, email');
  if (pErr) return res.status(500).json({ error: pErr.message });
  const emailById = new Map();
  const nameById = new Map();
  for (const p of playersRows || []) {
    if (p.email && p.email !== 'unknown') emailById.set(p.id, p.email.toLowerCase());
    nameById.set(p.id, p.name);
  }

  // Preload all subscriptions once, grouped by email, to avoid a query per player.
  const { data: subs, error: sErr } = await supabase.from('push_subscriptions').select('*');
  if (sErr) return res.status(500).json({ error: sErr.message });
  const subsByEmail = new Map();
  for (const row of subs || []) {
    const key = (row.user_email || '').toLowerCase();
    if (!key) continue;
    if (!subsByEmail.has(key)) subsByEmail.set(key, []);
    subsByEmail.get(key).push(row);
  }

  let totalSent = 0;
  let totalTargets = 0;

  for (const round of openRounds) {
    const played = Array.isArray(round.teams) ? round.teams.flat() : [];
    const voted = new Set(Array.isArray(round.mvpVoters) ? round.mvpVoters : []);
    const reminded = new Set(Array.isArray(round.mvpReminded) ? round.mvpReminded : []);

    // Target: played, not voted, not already reminded, has a resolvable email.
    const targets = played.filter((pid) => !voted.has(pid) && !reminded.has(pid) && emailById.has(pid));
    if (targets.length === 0) continue;

    const newlyReminded = [];
    for (const pid of targets) {
      totalTargets++;
      const email = emailById.get(pid);
      const name = nameById.get(pid) || 'שחקן';
      const rows = subsByEmail.get(email) || [];
      // Mark as reminded regardless of whether they have a live subscription —
      // we've done our one attempt; we never nag again for this round.
      newlyReminded.push(pid);
      const payload = JSON.stringify({
        title: 'מי היה המצטיין אתמול? 🌟',
        body: `${name}, עדיין לא בחרת מצטיין למשחק של אתמול — כנס עכשיו לדרג לפני שנועלים!`,
        url: '/GameHistory',
      });
      for (const row of rows) {
        try {
          await webpush.sendNotification(row.subscription, payload);
          totalSent++;
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
          }
        }
      }
    }

    // Persist the reminded set so we never send twice, even on the next cron run.
    if (newlyReminded.length > 0) {
      const merged = Array.from(new Set([...(round.mvpReminded || []), ...newlyReminded]));
      await supabase.from('rounds').update({ mvpReminded: merged }).eq('id', round.id);
    }
  }

  // Admin health-check copy: whenever the cron actually reminded someone, send
  // the admin a summary push so they can confirm the automation ran — without
  // being on any roster. Only fires on days there was something to send (no spam).
  if (totalTargets > 0) {
    const adminSubs = subsByEmail.get(ADMIN_EMAIL) || [];
    const adminPayload = JSON.stringify({
      title: 'תזכורת מצטיין נשלחה ✅',
      body: `נשלחו תזכורות ל-${totalTargets} שחקנים שעדיין לא בחרו מצטיין.`,
      url: '/GameHistory',
    });
    for (const row of adminSubs) {
      try {
        await webpush.sendNotification(row.subscription, adminPayload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
        }
      }
    }
  }

  return res.status(200).json({ ok: true, rounds: openRounds.length, targets: totalTargets, sent: totalSent });
}
