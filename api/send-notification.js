import webpush from 'web-push';
import { getSupabaseAdmin, getCallerUser, isAdminUser } from './_supabaseAdmin.js';
import { getRestrictedEmails, withoutRestricted } from './_restrictedEmails.js';
import { VAPID_PUBLIC_KEY } from '../src/lib/vapidPublic.js';

const ADMIN_EMAIL = 'libermanasaf@gmail.com';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const VAPID_PUBLIC = VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;

  if (!VAPID_PRIVATE) {
    return res.status(500).json({ error: 'VAPID_PRIVATE_KEY not configured in Vercel env' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }
  // Hard fail (instead of silently sending to nobody) when the service_role key
  // is missing: under RLS an anon-keyed client reads 0 push_subscriptions, so
  // every push would vanish without a trace. Make the misconfig loud.
  if (!supabase.__isServiceRole) {
    console.error('[send-notification] SUPABASE_SERVICE_ROLE_KEY missing — RLS will hide all subscriptions');
    return res.status(500).json({
      error: 'SUPABASE_SERVICE_ROLE_KEY חסר ב-Vercel — לא ניתן לקרוא מנויים תחת RLS. הגדר את המפתח ובצע redeploy.',
    });
  }

  webpush.setVapidDetails('mailto:libermanasaf@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

  const { title, body, url, targetEmail } = req.body || {};

  // Authorization. The real abuse vector is BROADCAST (a stranger blasting every
  // subscriber with spam/phishing) and targeting arbitrary players. Gate by audience:
  //   • Notify the ADMIN only (targetEmail === admin): allowed without auth —
  //     this is the system "new signup / new registration" alert, runs before a
  //     session exists, and only ever reaches the admin (not an attack surface).
  //   • Everything else (broadcast to all, or targeting another player): requires
  //     a valid ADMIN JWT.
  const targetsAdminOnly = targetEmail && targetEmail.toLowerCase() === ADMIN_EMAIL;
  if (!targetsAdminOnly) {
    const caller = await getCallerUser(req, supabase);
    if (!caller) return res.status(401).json({ error: 'נדרשת התחברות' });
    if (!isAdminUser(caller)) {
      return res.status(403).json({ error: 'רק מנהל יכול לשלוח התראות' });
    }
  }
  const payload = JSON.stringify({
    title: title || 'סינתטיקו חולון',
    body: body || '',
    url: url || '/',
  });
  let query = supabase.from('push_subscriptions').select('*');
  if (targetEmail) query = query.eq('user_email', targetEmail.toLowerCase());
  const { data: subs, error } = await query;
  if (error) {
    return res.status(500).json({ error: error.message });
  }

  // Restricted players are cut off from the club-wide experience, so they must
  // not be notified either — a push would link them to a page they cannot open.
  // Applies to a targeted send too: the admin alert (targetEmail === admin) is
  // unaffected because the admin is never a restricted player.
  const restricted = await getRestrictedEmails(supabase);
  const recipients = withoutRestricted(subs, restricted);

  let sent = 0;
  let failed = 0;

  await Promise.all(
    (recipients || []).map(async (row) => {
      try {
        await webpush.sendNotification(row.subscription, payload);
        sent++;
      } catch (err) {
        failed++;
        // Remove expired or invalid subscriptions so the table stays clean
        if (err.statusCode === 404 || err.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', row.endpoint);
        }
      }
    })
  );

  return res.status(200).json({ sent, failed });
}
