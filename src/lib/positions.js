// Player field positions — the club's convention: CB=בלם, MC=קשר, ST=חלוץ.
// players.position holds the code (or null when unassigned).
export const POSITION_LABELS = { CB: 'בלם', MC: 'קשר', ST: 'חלוץ' };

// Chip styling per position — deliberately distinct from the three TEAM
// colors (yellow/blue/orange) so position never reads as team on mixed views.
export const POSITION_STYLE = {
  CB: 'text-sky-300 ring-sky-500/30 bg-sky-500/10',
  MC: 'text-emerald-300 ring-emerald-500/30 bg-emerald-500/10',
  ST: 'text-rose-300 ring-rose-500/30 bg-rose-500/10',
};
