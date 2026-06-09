import { getSupabaseAdmin, getCallerUser } from './_supabaseAdmin.js';

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

  // Authorization (flexible — runs right after signUp, where a session may not
  // exist yet if email confirmation is on):
  //   • If a JWT is present, it MUST match the userId being linked.
  //   • Otherwise, the userId must be a real auth user created just now
  //     (within the last 2 minutes) — so an attacker can't pass an arbitrary
  //     userId to pre-claim a profile.
  // Either way the "already linked" guard below prevents hijacking a claimed row.
  const caller = await getCallerUser(req, supabase);
  if (caller) {
    if (caller.id !== userId) {
      return res.status(403).json({ error: 'ניתן לקשר רק את החשבון שלך' });
    }
  } else {
    // No session (email-confirmation flow). Validate strictly: the userId must
    // be a real auth user, freshly created (tightened to 60s), and the email
    // sent MUST exactly match that user's email — no optional bypass. This binds
    // the link request to the actual account that was just created server-side.
    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const u = authUser?.user;
    if (!u) return res.status(401).json({ error: 'משתמש לא תקף' });
    const ageMs = Date.now() - new Date(u.created_at).getTime();
    if (!(ageMs >= 0 && ageMs < 60 * 1000)) {
      return res.status(403).json({ error: 'קישור מותר רק בעת ההרשמה' });
    }
    if (!u.email || !email || u.email.toLowerCase() !== email.toLowerCase()) {
      return res.status(403).json({ error: 'אימייל לא תואם' });
    }
  }

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
