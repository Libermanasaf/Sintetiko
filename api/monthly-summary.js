import webpush from 'web-push';
import { getSupabaseAdmin } from './_supabaseAdmin.js';
import { VAPID_PUBLIC_KEY } from '../src/lib/vapidPublic.js';

const ADMIN_EMAIL = 'libermanasaf@gmail.com';

// Monthly cron (1st of month, ~noon Israel): send every player who appeared in
// the PREVIOUS month a personal FIFA-style recap push — appearances, wins,
// goals, MVP wins. Sent at most once per month (monthly_summary_log dedupe).
//
// Query params:
//   ?dry=1    compute and return the payloads without sending or logging
//   ?force=1  bypass the Israel-noon hour guard (manual testing)
//   ?resend=1 bypass the once-per-month dedupe (use with care)
export default async function handler(req, res) {
  const cronSecret = process.env.CRON_SECRET;
  const auth = req.headers?.authorization || '';
  const dry = req.query?.dry === '1';
  // Dry runs are read-only and safe; real sends require the cron secret when set.
  if (cronSecret && !dry && auth !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  // Hour guard: only fire around Israel noon (cron is 09:00 UTC on the 1st).
  const israelHour = Number(
    new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Jerusalem', hour: 'numeric', hour12: false })
      .format(new Date())
  );
  const forced = req.query?.force === '1';
  if (!forced && !dry && (israelHour < 11 || israelHour > 13)) {
    return res.status(200).json({ ok: true, skipped: 'outside Israel noon window', israelHour });
  }

  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  if (!VAPID_PRIVATE) return res.status(500).json({ error: 'VAPID_PRIVATE_KEY not configured' });

  const supabase = getSupabaseAdmin();
  if (!supabase || !supabase.__isServiceRole) {
    return res.status(500).json({ error: 'SUPABASE_SERVICE_ROLE_KEY missing' });
  }

  webpush.setVapidDetails('mailto:libermanasaf@gmail.com', VAPID_PUBLIC_KEY, VAPID_PRIVATE);

  // ---- Previous month window (Israel time) --------------------------------
  const nowIL = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jerusalem' }));
  const monthStart = new Date(nowIL.getFullYear(), nowIL.getMonth() - 1, 1);
  const monthEnd = new Date(nowIL.getFullYear(), nowIL.getMonth(), 1);
  const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
  const monthName = new Intl.DateTimeFormat('he-IL', { month: 'long', timeZone: 'Asia/Jerusalem' })
    .format(monthStart);

  // Dedupe: one summary per month, ever.
  if (req.query?.resend !== '1') {
    const { data: logRow } = await supabase
      .from('monthly_summary_log').select('month').eq('month', monthKey).maybeSingle();
    if (logRow) {
      return res.status(200).json({ ok: true, skipped: `already sent for ${monthKey}` });
    }
  }

  // ---- Load the month's rounds + players + subscriptions ------------------
  const { data: rounds, error: rErr } = await supabase
    .from('rounds')
    .select('id, date, teams, winningTeam, player_goals, mvpVotes, is_closed')
    .gte('date', monthStart.toISOString())
    .lt('date', monthEnd.toISOString());
  if (rErr) return res.status(500).json({ error: rErr.message });

  const { data: playersRows, error: pErr } = await supabase
    .from('players').select('id, name, email');
  if (pErr) return res.status(500).json({ error: pErr.message });

  const { data: subs, error: sErr } = await supabase.from('push_subscriptions').select('*');
  if (sErr) return res.status(500).json({ error: sErr.message });
  const subsByEmail = new Map();
  for (const row of subs || []) {
    const key = (row.user_email || '').toLowerCase();
    if (!key) continue;
    if (!subsByEmail.has(key)) subsByEmail.set(key, []);
    subsByEmail.get(key).push(row);
  }

  // ---- Aggregate per player ------------------------------------------------
  // stats: { appearances, wins, goals, mvp }
  const stats = new Map();
  const bump = (pid, field, by = 1) => {
    if (!stats.has(pid)) stats.set(pid, { appearances: 0, wins: 0, goals: 0, mvp: 0 });
    stats.get(pid)[field] += by;
  };

  for (const round of rounds || []) {
    const teams = Array.isArray(round.teams) ? round.teams : [];
    teams.flat().forEach((pid) => bump(pid, 'appearances'));
    if (round.winningTeam != null && teams[round.winningTeam]) {
      teams[round.winningTeam].forEach((pid) => bump(pid, 'wins'));
    }
    const goals = round.player_goals && typeof round.player_goals === 'object' ? round.player_goals : {};
    for (const [pid, g] of Object.entries(goals)) {
      const n = Number(g) || 0;
      if (n > 0) bump(pid, 'goals', n);
    }
    // Round MVP: top-voted with >= 5 votes, closed rounds only (season rule).
    const votes = round.mvpVotes && typeof round.mvpVotes === 'object' ? round.mvpVotes : {};
    const entries = Object.entries(votes).map(([pid, c]) => [pid, Number(c) || 0]);
    if (round.is_closed && entries.length) {
      const max = Math.max(...entries.map(([, c]) => c));
      if (max >= 5) entries.filter(([, c]) => c === max).forEach(([pid]) => bump(pid, 'mvp'));
    }
  }

  // ---- Build + send personalized pushes ------------------------------------
  const messages = [];
  for (const p of playersRows || []) {
    const s = stats.get(p.id);
    if (!s || s.appearances < 1) continue; // only players who actually played
    const email = (p.email || '').toLowerCase();
    if (!email || email === 'unknown') continue;

    // Positive-only, grammatical Hebrew: singular forms for 1, zeros omitted
    // (except appearances, which gate inclusion anyway).
    const parts = [s.appearances === 1 ? 'הופעה אחת' : `${s.appearances} הופעות`];
    if (s.wins > 0) parts.push(s.wins === 1 ? 'ניצחון אחד' : `${s.wins} ניצחונות`);
    if (s.goals > 0) parts.push(s.goals === 1 ? 'שער אחד' : `${s.goals} שערים`);
    if (s.mvp > 0) parts.push(`MVP ×${s.mvp}`);
    const body = `${p.name}, סיכום ${monthName} שלך: ${parts.join(' · ')} 💪`;
    messages.push({ name: p.name, email, body, hasSub: subsByEmail.has(email) });
  }

  if (dry) {
    return res.status(200).json({
      ok: true, dry: true, month: monthKey, rounds: (rounds || []).length,
      wouldSend: messages.filter((m) => m.hasSub).length,
      noSubscription: messages.filter((m) => !m.hasSub).length,
      messages,
    });
  }

  let sent = 0;
  for (const m of messages) {
    const payload = JSON.stringify({
      title: `הסיכום החודשי שלך ⚽`,
      body: m.body,
      url: '/Statistics',
    });
    for (const row of subsByEmail.get(m.email) || []) {
      try {
        await webpush.sendNotification(row.subscription, payload);
        sent++;
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
        }
      }
    }
  }

  // Log the month so it never sends twice.
  await supabase.from('monthly_summary_log').upsert(
    { month: monthKey, players: messages.length, pushes_sent: sent, sent_at: new Date().toISOString() },
    { onConflict: 'month' }
  );

  // Admin health-check push.
  const adminPayload = JSON.stringify({
    title: 'סיכום חודשי נשלח ✅',
    body: `סיכום ${monthName} נשלח ל-${messages.filter((m) => m.hasSub).length} שחקנים (${sent} התראות).`,
    url: '/Statistics',
  });
  for (const row of subsByEmail.get(ADMIN_EMAIL) || []) {
    try { await webpush.sendNotification(row.subscription, adminPayload); } catch {}
  }

  return res.status(200).json({ ok: true, month: monthKey, players: messages.length, sent });
}
