// Emails of players the admin has RESTRICTED (players.is_restricted).
//
// A restricted player is cut off from the club-wide experience: the RouteGuard
// blocks the pages, and they must not receive push notifications either —
// otherwise a "הרשימה פורסמה" or MVP prompt still lands on their phone and
// links them to a screen they cannot open.
//
// Returns a lowercase Set. On error it returns an EMPTY set, which means the
// caller sends to everyone — failing open is deliberate: a transient read
// error should degrade to the old behaviour, not silently mute the whole club.
// Broadcasts are the only thing this affects; a targeted send is checked
// separately by the caller.
export async function getRestrictedEmails(supabase) {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('email')
      .eq('is_restricted', true);
    if (error) {
      console.warn('[restricted] lookup failed — not filtering', error.message);
      return new Set();
    }
    return new Set(
      (data || [])
        .map((p) => (p.email || '').trim().toLowerCase())
        .filter(Boolean)
    );
  } catch (err) {
    console.warn('[restricted] lookup threw — not filtering', err?.message);
    return new Set();
  }
}

// Drops subscriptions belonging to restricted players.
export function withoutRestricted(subs, restrictedEmails) {
  if (!restrictedEmails?.size) return subs || [];
  return (subs || []).filter(
    (row) => !restrictedEmails.has((row.user_email || '').trim().toLowerCase())
  );
}
