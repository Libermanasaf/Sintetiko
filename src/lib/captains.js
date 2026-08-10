// Round captains (the evening's referees): one player per team.
//
// Selection is RANDOM but rotated — picking purely at random would keep landing
// on the same few players. So we bucket each team by how many times its players
// have already captained, and draw only from the least-experienced bucket. A
// player who has never refereed always outranks one who has, and ties inside a
// bucket are broken randomly, so consecutive reshuffles still differ.

// counts: { [playerId]: number } — how many rounds this player has captained.
// Returns the ids eligible for the draw: everyone tied at the minimum count.
function leastExperienced(teamIds, counts) {
  if (!teamIds.length) return [];
  let min = Infinity;
  for (const id of teamIds) min = Math.min(min, counts[id] || 0);
  return teamIds.filter((id) => (counts[id] || 0) === min);
}

// Picks one captain per team. `teams` is an array of id-arrays.
// `avoid` (optional) is the previous captain list — we try not to repeat the
// same person for the same team on a reshuffle, as long as the pool allows it.
export function pickCaptains(teams, counts = {}, avoid = null) {
  return (teams || []).map((teamIds, i) => {
    const pool = leastExperienced(teamIds || [], counts);
    if (!pool.length) return null;
    // Only exclude the previous pick when something else is available —
    // a one-player pool must still return that player.
    const prev = avoid?.[i];
    const fresh = pool.length > 1 ? pool.filter((id) => id !== prev) : pool;
    const choices = fresh.length ? fresh : pool;
    return choices[Math.floor(Math.random() * choices.length)];
  });
}

// Tally captaincies across rounds. Accepts whatever Round.list() returns and
// ignores rounds saved before this feature existed (captains == null).
export function countCaptaincies(rounds) {
  const counts = {};
  for (const r of rounds || []) {
    for (const id of r?.captains || []) {
      if (id) counts[id] = (counts[id] || 0) + 1;
    }
  }
  return counts;
}
