// ─── One-off extra game day: Tuesday 21.7.2026 ─────────────────────────────
// User-requested, single week: signup + a Lists column exist until Wednesday
// morning 22.7 08:00, then vanish permanently. Single source of truth for the
// gate — the whole feature is safe to delete after it expires.
export const ONE_OFF_TUESDAY_EXPIRES = new Date('2026-07-22T08:00:00+03:00');
export const oneOffTuesdayActive = () => Date.now() < ONE_OFF_TUESDAY_EXPIRES.getTime();
