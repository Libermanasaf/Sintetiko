import webpush from 'web-push';
import { getSupabaseAdmin } from './_supabaseAdmin.js';
import { VAPID_PUBLIC_KEY } from '../src/lib/vapidPublic.js';

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

  webpush.setVapidDetails('mailto:libermanasaf@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

  const { title, body, url, targetEmail } = req.body || {};
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

  let sent = 0;
  let failed = 0;

  await Promise.all(
    (subs || []).map(async (row) => {
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
