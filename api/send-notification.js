import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const VAPID_PUBLIC = process.env.VITE_VAPID_PUBLIC_KEY;
  const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
  const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

  if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
    return res.status(500).json({ error: 'VAPID keys not configured' });
  }
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(500).json({ error: 'Supabase not configured' });
  }

  webpush.setVapidDetails('mailto:libermanasaf@gmail.com', VAPID_PUBLIC, VAPID_PRIVATE);

  const { title, body, url, targetEmail } = req.body || {};
  const payload = JSON.stringify({
    title: title || 'סינתטיקו חולון',
    body: body || '',
    url: url || '/',
  });

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
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
