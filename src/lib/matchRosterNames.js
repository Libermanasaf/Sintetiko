import { isRolePlaceholder } from '@/lib/rosterPlaceholders';

// Splits pasted roster text into names: one per line, list numbering
// ("1." / "2)" / "3-") stripped, blank lines dropped.
export const parseRosterLines = (text) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .map((line) => line.replace(/^\d+[\.\)\-\s]+/, '').trim())
    .filter((line) => line.length > 0);

// Matches pasted names to players (case-insensitive, partial match).
//
// A roster line may legitimately repeat a PLACEHOLDER — "שוער" appears once
// per team. De-duplicating by id silently dropped every occurrence after
// the first, so the round came out a player short.
//
// Teams are arrays of player ids, and every screen resolves a row by
// looking that id up in `players` — so a repeat cannot reuse the same id
// (breaks the balancer and captain draw) nor invent one (renders blank).
// Instead each occurrence claims the NEXT distinct player row sharing that
// placeholder name; the roster carries one such row per team. If the list
// asks for more than exist, the extras are reported as unmatched rather
// than silently dropped. Real players are de-duplicated.
//
// `taken` holds players already claimed elsewhere (e.g. by an earlier team
// in the same paste), so placeholders keep claiming distinct rows across
// calls and a real player named twice is reported in `duplicates`.
export function matchRosterNames(names, players, taken = []) {
  const matched = [];
  const unmatched = [];
  const duplicates = [];
  const claimed = (id) => matched.some((m) => m.id === id) || taken.some((m) => m.id === id);

  names.forEach((name) => {
    const lower = name.toLowerCase();
    const candidates = players.filter((p) =>
      p.name.toLowerCase().includes(lower) || lower.includes(p.name.toLowerCase())
    );
    if (candidates.length === 0) { unmatched.push(name); return; }

    if (isRolePlaceholder(candidates[0].name)) {
      const free = candidates.find((c) => !claimed(c.id));
      if (free) matched.push(free);
      else unmatched.push(name); // more placeholders requested than rows exist
      return;
    }

    const found = candidates[0];
    if (!claimed(found.id)) matched.push(found);
    else if (taken.some((m) => m.id === found.id)) duplicates.push(found.name);
  });

  return { matched, unmatched, duplicates };
}
