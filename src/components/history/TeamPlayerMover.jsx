import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeftRight, X, User, Search, Replace } from 'lucide-react';
import { rosterStatDeltas } from '@/lib/rosterEdit';
import { nameMatches } from '@/lib/hebrewSearch';

const TEAMS = [
  { name: 'הצהובים', dot: 'bg-yellow-400', ring: 'ring-yellow-400/40', chip: 'bg-yellow-400/15 text-yellow-200 ring-yellow-400/40' },
  { name: 'הכחולים', dot: 'bg-sky-500', ring: 'ring-sky-400/40', chip: 'bg-sky-500/15 text-sky-200 ring-sky-400/40' },
  { name: 'הכתומים', dot: 'bg-orange-500', ring: 'ring-orange-400/40', chip: 'bg-orange-500/15 text-orange-200 ring-orange-400/40' },
];

// Admin fix-up of a past round's roster: replace a player who didn't come (or
// was entered by mistake) with whoever actually played, swap two players, or
// move one to another team. Tap-based — HTML5 drag never worked on phones.
// The stat changes the save will apply are previewed before saving.
export default function TeamPlayerMover({ round, players, inCurrentSeason, saving, onSave, onClose }) {
  const [teams, setTeams] = useState(() => round.teams.map((t) => [...t]));
  // oldId -> newId for slots whose player was swapped for someone from outside
  // the round, so captain / goals follow the slot.
  const [replacements, setReplacements] = useState({});
  const [selected, setSelected] = useState(null); // { playerId, teamIndex }
  const [picking, setPicking] = useState(false);
  const [query, setQuery] = useState('');

  const byId = useMemo(() => new Map(players.map((p) => [p.id, p])), [players]);
  const nameOf = (id) => byId.get(id)?.name || '—';
  const teamOf = (id) => teams.findIndex((t) => t.includes(id));

  const deltas = useMemo(
    () => rosterStatDeltas(round, teams, inCurrentSeason),
    [round, teams, inCurrentSeason]
  );
  const changed = useMemo(
    () => teams.some((t, i) => t.join() !== (round.teams[i] || []).join()),
    [teams, round.teams]
  );

  const select = (playerId, teamIndex) => {
    setSelected((s) => (s?.playerId === playerId ? null : { playerId, teamIndex }));
    setPicking(false);
    setQuery('');
  };

  const moveTo = (toTeam) => {
    const { playerId, teamIndex } = selected;
    setTeams((prev) => {
      const next = prev.map((t) => [...t]);
      next[teamIndex] = next[teamIndex].filter((id) => id !== playerId);
      next[toTeam].push(playerId);
      return next;
    });
    setSelected(null);
  };

  const replaceWith = (newId) => {
    const { playerId: oldId, teamIndex } = selected;
    const otherTeam = teamOf(newId);
    setTeams((prev) => {
      const next = prev.map((t) => [...t]);
      const oldIdx = next[teamIndex].indexOf(oldId);
      if (otherTeam !== -1) {
        // Both are in the round: swap their places.
        const newIdx = next[otherTeam].indexOf(newId);
        next[otherTeam][newIdx] = oldId;
      }
      next[teamIndex][oldIdx] = newId;
      return next;
    });
    if (otherTeam === -1) {
      setReplacements((prev) => {
        // Chain through earlier replacements (A→B then B→C means A→C) and
        // drop a mapping that came back to itself (A→B then B→A).
        const next = {};
        for (const [from, to] of Object.entries(prev)) next[from] = to === oldId ? newId : to;
        const origin = Object.keys(prev).find((k) => prev[k] === oldId);
        if (!origin) next[oldId] = newId;
        for (const k of Object.keys(next)) if (next[k] === k) delete next[k];
        return next;
      });
    }
    setSelected(null);
    setPicking(false);
    setQuery('');
  };

  // Picker: people in the round first (a swap), then everyone else by name.
  const candidates = useMemo(() => {
    if (!selected) return [];
    const inRound = new Set(teams.flat());
    return players
      .filter((p) => p.id !== selected.playerId && nameMatches(p.name, query))
      .sort((a, b) =>
        (inRound.has(b.id) - inRound.has(a.id)) || (a.name || '').localeCompare(b.name || '', 'he')
      )
      .slice(0, 60);
  }, [players, selected, query, teams]);

  const deltaLines = Object.entries(deltas).map(([id, d]) => {
    const parts = [];
    if (d.appearances) parts.push(`${d.appearances > 0 ? '+' : '−'}1 הופעה`);
    if (d.wins) parts.push(`${d.wins > 0 ? '+' : '−'}1 גביע`);
    if (d.season_wins) parts.push(`${d.season_wins > 0 ? '+' : '−'}1 בפודיום`);
    return { id, text: parts.join(' · '), up: d.appearances > 0 || d.wins > 0 };
  });

  return createPortal(
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.7)] overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col max-h-[calc(100dvh-var(--bottom-nav-h)-1rem)] sm:max-h-[92vh] mb-[var(--bottom-nav-h)] sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-amber-400/15 ring-1 ring-amber-400/30 shrink-0">
              <ArrowLeftRight className="w-5 h-5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black st-gold-text">עריכת שחקני המחזור</h2>
              <p className="text-[0.7rem] text-slate-400 font-bold">לחץ על שחקן כדי להחליף או להעביר</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white active:scale-95 transition-all touch-manipulation shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-4 overflow-y-auto space-y-3">
          {teams.map((teamIds, teamIndex) => {
            const team = TEAMS[teamIndex % TEAMS.length];
            return (
              <div key={teamIndex} className={`rounded-2xl bg-slate-800/50 ring-1 ${team.ring} overflow-hidden`}>
                <div className="flex items-center justify-between px-3.5 py-2 border-b border-white/5">
                  <span className="flex items-center gap-2 text-sm font-black text-white">
                    <span className={`w-2.5 h-2.5 rounded-full ${team.dot}`} />
                    {team.name}
                    {round.winningTeam === teamIndex && <span className="text-xs">🏆</span>}
                  </span>
                  <span className="text-xs font-bold text-slate-500 tnum">{teamIds.length}</span>
                </div>
                <div className="p-2 flex flex-wrap gap-1.5">
                  {teamIds.map((id) => {
                    const isSel = selected?.playerId === id;
                    return (
                      <button
                        key={id}
                        onClick={() => select(id, teamIndex)}
                        className={`min-h-[40px] px-3 rounded-xl text-sm font-bold ring-1 transition-all active:scale-95 touch-manipulation ${
                          isSel
                            ? 'bg-amber-400 text-slate-950 ring-amber-300'
                            : 'bg-slate-900/70 text-white ring-white/10'
                        }`}
                      >
                        {nameOf(id)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Actions for the selected player */}
          {selected && !picking && (
            <div className="rounded-2xl bg-amber-400/10 ring-1 ring-amber-400/30 p-3 space-y-2.5">
              <p className="text-sm font-black text-amber-200">{nameOf(selected.playerId)}</p>
              <button
                onClick={() => setPicking(true)}
                className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-amber-400 text-slate-950 text-sm font-black active:scale-[0.98] transition-transform touch-manipulation"
              >
                <Replace className="w-4 h-4" />
                החלף בשחקן אחר
              </button>
              <div className="flex gap-2">
                {teams.map((_, ti) => ti !== selected.teamIndex && (
                  <button
                    key={ti}
                    onClick={() => moveTo(ti)}
                    className={`flex-1 min-h-[44px] rounded-xl text-xs font-black ring-1 active:scale-95 transition-transform touch-manipulation ${TEAMS[ti % TEAMS.length].chip}`}
                  >
                    העבר ל{TEAMS[ti % TEAMS.length].name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Replacement picker */}
          {selected && picking && (
            <div className="rounded-2xl bg-slate-800/60 ring-1 ring-white/10 overflow-hidden">
              <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-white/5">
                <span className="text-sm font-black text-white truncate">במקום {nameOf(selected.playerId)}:</span>
                <button onClick={() => setPicking(false)} aria-label="חזור" className="text-slate-400 hover:text-white p-1">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-2.5">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="חפש שחקן…"
                    autoFocus
                    className="w-full min-h-[44px] pr-9 pl-3 rounded-xl bg-slate-900/80 ring-1 ring-white/10 text-white text-base sm:text-sm placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-400/60"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-white/5">
                {candidates.map((p) => {
                  const t = teamOf(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => replaceWith(p.id)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-right hover:bg-white/5 active:bg-white/10 touch-manipulation"
                    >
                      {p.image ? (
                        <img src={p.image} alt="" loading="lazy" className="w-7 h-7 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="grid place-items-center w-7 h-7 rounded-full bg-slate-700 shrink-0">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        </div>
                      )}
                      <span className="flex-1 text-sm font-bold text-white truncate">{p.name}</span>
                      {t !== -1 && (
                        <span className={`shrink-0 px-2 py-0.5 rounded-md text-[0.65rem] font-black ring-1 ${TEAMS[t % TEAMS.length].chip}`}>
                          החלפה עם {TEAMS[t % TEAMS.length].name}
                        </span>
                      )}
                    </button>
                  );
                })}
                {candidates.length === 0 && (
                  <p className="px-3.5 py-4 text-sm text-slate-500 text-center">לא נמצא שחקן</p>
                )}
              </div>
            </div>
          )}

          {/* What the save will do to the stats */}
          {deltaLines.length > 0 && (
            <div className="rounded-2xl bg-slate-800/40 ring-1 ring-white/8 p-3">
              <p className="text-xs font-black text-slate-400 mb-1.5">שינויים בסטטיסטיקה:</p>
              <ul className="space-y-1">
                {deltaLines.map((l) => (
                  <li key={l.id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-bold text-white truncate">{nameOf(l.id)}</span>
                    <span className={`shrink-0 text-xs font-black ${l.up ? 'text-emerald-300' : 'text-rose-300'}`}>{l.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pt-3 pb-4 flex gap-2.5 border-t border-white/8 bg-slate-950/95 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-300 font-black text-sm active:scale-95 transition-transform touch-manipulation"
          >
            ביטול
          </button>
          <button
            onClick={() => onSave(teams, replacements)}
            disabled={!changed || saving}
            className="flex-1 min-h-[48px] rounded-xl st-foil font-black text-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-transform touch-manipulation"
          >
            {saving ? 'שומר…' : 'שמור שינויים'}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
