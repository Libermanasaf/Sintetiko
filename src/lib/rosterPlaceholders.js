// Roster entries that name a SLOT rather than a person. A day's list holds one
// per team, so they legitimately repeat — unlike a real player, whose name
// appearing twice is a mistake.
//
// Two places must agree on this, which is why it lives here:
//   • Lists.jsx  — the duplicate-name warning (which also blocks publishing)
//                  must not fire on them.
//   • QuickRoundModal — each occurrence must claim its own roster slot instead
//                  of collapsing into one player.
//
// Compare against a name normalized with trim + lowercase.
export const ROLE_PLACEHOLDERS = new Set(['שוער', 'שוער קבוע', 'אורח', 'חבר']);

export const isRolePlaceholder = (name) =>
  ROLE_PLACEHOLDERS.has((name || '').trim().replace(/\s+/g, ' ').toLowerCase());
