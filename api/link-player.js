import { getSupabaseAdmin } from './_supabaseAdmin.js';

// Links a freshly-signed-up auth user to an existing (unlinked) player row.
// Runs server-side with the service_role key so the client never needs UPDATE
// permission on `players` — which would let anyone flip is_approved or hijack
// another player's row. The server enforces the safe rules instead:
//   • the target player must still be UNLINKED (no user_id, no email)
//   • is_approved is hard-set to false here, never trusted from the client
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { playerId, userId, email } = req.body || {};
  if (!playerId || !userId || !email) {
    return res.status(400).json({ error: 'Missing playerId, userId or email' });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) return res.status(500).json({ error: 'Supabase not configured' });

  // Load the target row and refuse if it's already claimed by someone.
  const { data: player, error: readErr } = await supabase
    .from('players')
    .select('id, user_id, email')
    .eq('id', playerId)
    .maybeSingle();

  if (readErr) return res.status(500).json({ error: readErr.message });
  if (!player) return res.status(404).json({ error: 'Player not found' });
  if (player.user_id || player.email) {
    return res.status(409).json({ error: 'הפרופיל הזה כבר מקושר לחשבון קיים' });
  }

  const { data: linked, error: updErr } = await supabase
    .from('players')
    .update({
      user_id: userId,
      email: email.toLowerCase(),
      is_approved: false, // never trust the client for this
    })
    .eq('id', playerId)
    // Guard against a race: only update while still unlinked.
    .is('user_id', null)
    .select('name')
    .single();

  if (updErr) return res.status(500).json({ error: updErr.message });
  return res.status(200).json({ name: linked?.name || null });
}
