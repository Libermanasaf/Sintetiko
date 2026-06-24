// Records login / daily-presence events for the admin "כניסות למערכת" screen.
// Fail-soft by design: a tracking write must NEVER block or break auth.
import { supabase } from './supabase';

// The screen the user is on right now (first screen of this session/day).
function currentPage() {
  try {
    return (window.location.pathname || '/').slice(0, 80);
  } catch {
    return null;
  }
}

// Logs a deliberate login (someone signed in with credentials).
export async function recordLogin(user, name) {
  if (!supabase || !user?.id) return;
  try {
    await supabase.from('login_events').insert({
      user_id: user.id,
      email: user.email?.toLowerCase() || null,
      name: name || null,
      event_type: 'login',
      entry_page: currentPage(),
    });
  } catch { /* ignore — tracking is best-effort */ }
}

// Logs at most one "daily presence" row per user per local day. The localStorage
// guard avoids hammering the DB on every PWA resume/refresh; the DB also has a
// unique index as the real backstop (so duplicates across devices are dropped).
export async function recordDailyPresence(user, name) {
  if (!supabase || !user?.id) return;
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' }); // YYYY-MM-DD
  const key = `sintetiko_daily_seen_${user.id}`;
  if (localStorage.getItem(key) === today) return;
  try {
    const { error } = await supabase.from('login_events').insert({
      user_id: user.id,
      email: user.email?.toLowerCase() || null,
      name: name || null,
      event_type: 'daily',
      entry_page: currentPage(),
    });
    // 23505 = unique violation: a daily row already exists for today — that's fine.
    if (!error || error.code === '23505') localStorage.setItem(key, today);
  } catch { /* ignore */ }
}
