// Fixing a past round's roster (a player didn't show, or was entered by
// mistake). Changing `teams` alone leaves the stored counters wrong, because
// they were bumped when the round was opened / closed:
//   appearances  +1 for everyone in the round       (StepOpeningTeam)
//   wins         +1 for the winning team, career    (StepResults / MatchDay)
//   season_wins  +1 for the winning team, podium    (same places)
// So an edit must move those counters along with the players.

// Per-player counter deltas between the round's current teams and `nextTeams`.
// `inCurrentSeason`: only then does the edit touch season_wins — a round from
// a closed season must not shift the live podium.
export function rosterStatDeltas(round, nextTeams, inCurrentSeason) {
  const deltas = {};
  const bump = (id, key, by) => {
    const d = (deltas[id] ||= { appearances: 0, wins: 0, season_wins: 0 });
    d[key] += by;
  };

  const before = new Set((round.teams || []).flat());
  const after = new Set(nextTeams.flat());
  for (const id of before) if (!after.has(id)) bump(id, 'appearances', -1);
  for (const id of after) if (!before.has(id)) bump(id, 'appearances', +1);

  const w = round.winningTeam;
  if (w !== null && w !== undefined) {
    const wonBefore = new Set(round.teams?.[w] || []);
    const wonAfter = new Set(nextTeams[w] || []);
    for (const id of wonBefore) {
      if (wonAfter.has(id)) continue;
      bump(id, 'wins', -1);
      if (inCurrentSeason) bump(id, 'season_wins', -1);
    }
    for (const id of wonAfter) {
      if (wonBefore.has(id)) continue;
      bump(id, 'wins', +1);
      if (inCurrentSeason) bump(id, 'season_wins', +1);
    }
  }

  // Drop players whose moves cancelled out (e.g. moved and moved back).
  for (const [id, d] of Object.entries(deltas)) {
    if (!d.appearances && !d.wins && !d.season_wins) delete deltas[id];
  }
  return deltas;
}

// Carries per-player round data (captain, goalkeeper, goals) from a replaced
// player to whoever took their slot. `replacements` maps oldId -> newId.
export function remapRoundRefs(round, replacements) {
  const map = (id) => replacements[id] ?? id;
  const out = {};
  if (Array.isArray(round.captains)) out.captains = round.captains.map(map);
  if (round.goalkeepers && typeof round.goalkeepers === 'object') {
    out.goalkeepers = Object.fromEntries(
      Object.entries(round.goalkeepers).map(([team, id]) => [team, map(id)])
    );
  }
  if (round.player_goals && typeof round.player_goals === 'object') {
    const goals = {};
    for (const [id, n] of Object.entries(round.player_goals)) {
      const to = map(id);
      goals[to] = (goals[to] || 0) + n;
    }
    out.player_goals = goals;
  }
  return out;
}
