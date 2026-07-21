import { supabase } from '@/lib/supabase';

// A day's list is only visible to regular players AFTER the admin publishes it
// (by sending a push for that day). Publishing snapshots the current roster into
// lists_state.data.publishedLists[day]; players read that snapshot, never the
// live roster the admin is still editing. Editing after publish leaves the old
// snapshot in place, so changes stay hidden until the next push.

// Maps a SendNotification URL to its lists_state day key. Only day-list URLs
// publish; other targets (MatchDay, Podium, …) return null and publish nothing.
export const DAY_FROM_URL = {
  '/DayListSunday':    'sunday',
  '/DayListWednesday': 'wednesday',
  '/DayListThursday':  'thursday',
  '/DayListTuesday':   'tuesday',
};

// Snapshots the current roster for `day` into publishedLists[day]. Reads the
// live lists_state, copies that day's header+rows, writes back. Fire-and-forget
// safe: on error it throws so the caller can surface it, but push already sent.
//
// Two timestamps with two different jobs:
//   publishedAt      — freshness gate: get_lists_state serves players only
//                      days published in the last 24h, so this is ALWAYS now.
//   firstPublishedAt — the seen-checkmarks anchor (list_viewers): set on the
//                      first publish of a cycle and preserved on re-publishes,
//                      so roster tweaks never clear the ✓ marks.
export async function publishDayList(day) {
  if (!supabase || !day) return;

  const { data: row, error: readErr } = await supabase
    .from('lists_state')
    .select('data')
    .eq('id', 'main')
    .maybeSingle();
  if (readErr) throw readErr;

  const all = row?.data || {};
  const nowIso = new Date().toISOString();
  const prevPub = all.publishedLists?.[day] || {};
  const lastReset = all.lastReset?.[day];
  const prevFirst = prevPub.firstPublishedAt || prevPub.publishedAt;
  const sameCycle = !!prevFirst && (!lastReset || new Date(prevFirst) >= new Date(lastReset));
  const snapshot = {
    header: all.headers?.[day] || '',
    rows: all.rows?.[day] || [],
    publishedAt: nowIso,
    firstPublishedAt: sameCycle ? prevFirst : nowIso,
  };
  const nextData = {
    ...all,
    publishedLists: { ...(all.publishedLists || {}), [day]: snapshot },
  };

  const { error: writeErr } = await supabase
    .from('lists_state')
    .upsert(
      { id: 'main', data: nextData, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (writeErr) throw writeErr;
}

// Publishes a day, then re-reads lists_state to CONFIRM the snapshot actually
// landed before reporting success — so a silent failure (e.g. stale code, RLS)
// can't masquerade as "published". Throws if the write didn't take. Use this
// from any UI that publishes (Lists button, SendNotification) for one reliable
// path instead of fire-and-forget.
export async function publishDayListVerified(day) {
  await publishDayList(day);
  const { data: row, error } = await supabase
    .from('lists_state').select('data').eq('id', 'main').maybeSingle();
  if (error) throw error;
  if (!Array.isArray(row?.data?.publishedLists?.[day]?.rows)) {
    throw new Error('הפרסום לא נשמר ב-Supabase');
  }
}

// When the admin confirms a stand-by signup AFTER the day was already published,
// we don't re-publish to everyone. Instead the confirmed player's name is added
// to publishedLists[day].extraConfirmed — and only THAT player (matched by their
// logged-in email) sees it appended to their view. Returns true if it was added
// (i.e. the day was published), false if the day isn't published yet (caller
// then relies on the normal live-rows path, which publishes to all on next push).
export async function addConfirmedToPublished(day, { name, email }) {
  if (!supabase || !day || !name) return false;

  const { data: row, error: readErr } = await supabase
    .from('lists_state')
    .select('data')
    .eq('id', 'main')
    .maybeSingle();
  if (readErr) throw readErr;

  const all = row?.data || {};
  const pub = all.publishedLists?.[day];
  if (!pub) return false; // day not published yet → nothing to personalize

  const lowerEmail = (email || '').toLowerCase();
  const extra = Array.isArray(pub.extraConfirmed) ? pub.extraConfirmed : [];
  // Idempotent: don't add the same player twice.
  if (extra.some(e => (e.email || '').toLowerCase() === lowerEmail && lowerEmail)) return true;

  const nextPub = { ...pub, extraConfirmed: [...extra, { name, email: lowerEmail }] };
  const nextData = {
    ...all,
    publishedLists: { ...all.publishedLists, [day]: nextPub },
  };

  const { error: writeErr } = await supabase
    .from('lists_state')
    .upsert(
      { id: 'main', data: nextData, updated_at: new Date().toISOString() },
      { onConflict: 'id' }
    );
  if (writeErr) throw writeErr;
  return true;
}
