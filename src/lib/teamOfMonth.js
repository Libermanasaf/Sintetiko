// Team of the month: six players ranked by WINS, appearances as the tie-break,
// with a hard floor of MIN_APPEARANCES so someone who showed up twice and won
// both cannot outrank a regular.
//
// Shared by the monthly push (api/monthly-summary.js) and the TeamOfMonth page
// so the squad named in the notification is always the squad on the screen.
// Keep the two in step by changing only this file.
export const MIN_APPEARANCES = 3;
export const SQUAD_SIZE = 6;

// Tallies appearances + wins per player id from a month's rounds.
export function statsFromRounds(rounds) {
  const stats = new Map();
  const bump = (pid, field) => {
    if (!stats.has(pid)) stats.set(pid, { appearances: 0, wins: 0 });
    stats.get(pid)[field] += 1;
  };
  for (const round of rounds || []) {
    const teams = Array.isArray(round.teams) ? round.teams : [];
    teams.flat().forEach((pid) => bump(pid, 'appearances'));
    if (round.winningTeam != null && teams[round.winningTeam]) {
      teams[round.winningTeam].forEach((pid) => bump(pid, 'wins'));
    }
  }
  return stats;
}

// stats: Map<playerId, {appearances, wins}>; nameById: Map<playerId, name>.
// Returns at most SQUAD_SIZE entries — never padded with players below the floor.
export function pickTeamOfMonth(stats, nameById) {
  return [...stats.entries()]
    .filter(([pid, s]) => s.appearances >= MIN_APPEARANCES && nameById.has(pid))
    .map(([pid, s]) => ({ id: pid, name: nameById.get(pid), ...s }))
    .sort((a, b) =>
      b.wins - a.wins ||
      b.appearances - a.appearances ||
      // Last resort so the order is stable run-to-run rather than arbitrary.
      a.name.localeCompare(b.name, 'he')
    )
    .slice(0, SQUAD_SIZE);
}
