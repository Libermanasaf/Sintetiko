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

// Records that the logged-in user visited a page, as an atomic per-user counter
// (one row per user, bumped — never a row per visit, so egress stays flat).
// Skips noise: only counts real app areas, dedupes rapid repeats of the same path.
let _lastBumped = { path: null, at: 0 };
export async function recordPageVisit(page, name) {
  if (!supabase || !page) return;
  const path = String(page).slice(0, 60);
  const now = Date.now();
  // Ignore an immediate re-fire of the same path (e.g. double effect) within 1.5s.
  if (_lastBumped.path === path && now - _lastBumped.at < 1500) return;
  _lastBumped = { path, at: now };
  try {
    await supabase.rpc('bump_page_visit', { p_page: path, p_name: name || null });
  } catch { /* best-effort */ }
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
