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
    .select('id, date, teams, mvpVoters, mvpReminded, mvpVotes, mvpAnnounced, closed_at, is_closed')
    .eq('is_closed', true)
    .not('closed_at', 'is', null);
  if (rErr) return res.status(500).json({ error: rErr.message });

  const openRounds = (rounds || []).filter((r) => {
    const closedAt = new Date(r.closed_at).getTime();
    return nowMs < closedAt + windowMs; // still inside the voting window
  });

  // Rounds whose voting window has CLOSED and were never announced. Only
  // windows that closed in the last 72h get a push — anything older (e.g.
  // rounds from before this feature) is marked announced silently so we
  // never blast a backlog.
  const toAnnounce = (rounds || []).filter((r) => {
    if (r.mvpAnnounced) return false;
    const windowEnd = new Date(r.closed_at).getTime() + windowMs;
    return nowMs >= windowEnd;
  });

  if (openRounds.length === 0 && toAnnounce.length === 0) {
    return res.status(200).json({ ok: true, rounds: 0, sent: 0, announced: 0 });
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

  // ── MVP winner announcement ──────────────────────────────────────────────
  // Once a round's 48h voting window closes: one broadcast naming the winner
  // (a tie names everyone), a personal crown push to the winner(s), then the
  // round is flagged. Windows that closed more than 72h ago (e.g. rounds from
  // before this feature) are flagged silently — no backlog blast.
  let announced = 0;
  const recentMs = 72 * 60 * 60 * 1000;
  for (const round of toAnnounce) {
    const votes = round.mvpVotes && typeof round.mvpVotes === 'object' ? round.mvpVotes : {};
    const max = Math.max(0, ...Object.values(votes).map(Number));
    const winners = max > 0 ? Object.keys(votes).filter((pid) => Number(votes[pid]) === max) : [];
    const windowEnd = new Date(round.closed_at).getTime() + windowMs;
    const isRecent = nowMs - windowEnd < recentMs;

    if (winners.length > 0 && isRecent) {
      const names = winners.map((pid) => nameById.get(pid) || 'שחקן');
      const dayName = new Intl.DateTimeFormat('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long' })
        .format(new Date(round.date));
      const title = winners.length > 1 ? 'מצטייני המחזור 🌟' : 'מצטיין המחזור 🌟';
      const body = winners.length > 1
        ? `ההצבעה ננעלה! מצטייני מחזור ${dayName}: ${names.join(' ו')}`
        : `ההצבעה ננעלה! המצטיין של מחזור ${dayName}: ${names[0]} 👑`;
      const payload = JSON.stringify({ title, body, url: '/HallOfFame' });
      for (const row of subs || []) {
        try {
          await webpush.sendNotification(row.subscription, payload);
        } catch (err) {
          if (err.statusCode === 404 || err.statusCode === 410) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
          }
        }
      }

      // Personal crown for the winner(s)
      for (const pid of winners) {
        const email = emailById.get(pid);
        if (!email) continue;
        const personal = JSON.stringify({
          title: 'נבחרת מצטיין המחזור! 👑',
          body: `${nameById.get(pid) || ''}, חברי הקבוצה בחרו בך למצטיין של מחזור ${dayName} — כל הכבוד!`,
          url: '/HallOfFame',
        });
        for (const row of subsByEmail.get(email) || []) {
          try {
            await webpush.sendNotification(row.subscription, personal);
          } catch (err) {
            if (err.statusCode === 404 || err.statusCode === 410) {
              await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
            }
          }
        }
      }
      announced++;
    }

    // Flag regardless — no votes or too old closes out silently.
    await supabase.from('rounds').update({ mvpAnnounced: true }).eq('id', round.id);
  }

  // ── Admin noon push ─────────────────────────────────────────────────────
  // On GAME DAYS (Sun/Wed/Thu) the admin gets a match-day digest: roster fill,
  // how many viewed the list, standby waiting — plus today's MVP-reminder stats
  // folded in. On other days, only the health-check fires (and only when
  // reminders actually went out), so there's never noon spam.
  const sendToAdmin = async (title, body, url) => {
    const payload = JSON.stringify({ title, body, url });
    for (const row of subsByEmail.get(ADMIN_EMAIL) || []) {
      try {
        await webpush.sendNotification(row.subscription, payload);
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
        }
      }
    }
  };

  const israelDow = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', weekday: 'short' })
    .format(new Date());
  const dayKey = { Sun: 'sunday', Wed: 'wednesday', Thu: 'thursday' }[israelDow];
  const dayLabel = { sunday: 'ראשון', wednesday: 'רביעי', thursday: 'חמישי' }[dayKey];

  let digest = null;
  if (dayKey) {
    try {
      const { data: ls } = await supabase.from('lists_state').select('data').eq('id', 'main').maybeSingle();
      const d = ls?.data || {};
      const roster = (d.rows?.[dayKey] || []).filter((n) => n && n.trim());

      // Viewers of the CURRENT list only — same window list_viewers() uses:
      // views after the later of last publish / weekly reset.
      const publishedAt = d.publishedLists?.[dayKey]?.publishedAt;
      const lastReset = d.lastReset?.[dayKey];
      const threshold = [publishedAt, lastReset].filter(Boolean).sort().pop();
      let viewers = 0;
      if (threshold) {
        const { count } = await supabase
          .from('list_views').select('*', { count: 'exact', head: true })
          .eq('day', dayKey).gte('viewed_at', threshold);
        viewers = count || 0;
      }

      const { count: waiting } = await supabase
        .from('signups').select('*', { count: 'exact', head: true }).eq('day', dayKey);

      if (roster.length > 0) {
        const parts = [`רשימת ${dayLabel}: ${roster.length}/18`, `${viewers} ראו`];
        if ((waiting || 0) > 0) parts.push(`${waiting} ממתינים`);
        if (totalTargets > 0) parts.push(`תזכורות MVP: ${totalTargets}`);
        digest = parts.join(' · ');
      }
    } catch (e) {
      console.warn('[digest]', e);
    }
  }

  if (digest) {
    await sendToAdmin('תקציר יום המשחק 📋', digest, '/Lists');
  } else if (totalTargets > 0) {
    await sendToAdmin('תזכורת מצטיין נשלחה ✅',
      `נשלחו תזכורות ל-${totalTargets} שחקנים שעדיין לא בחרו מצטיין.`, '/GameHistory');
  }

  return res.status(200).json({ ok: true, rounds: openRounds.length, targets: totalTargets, sent: totalSent, announced, digest });
}
