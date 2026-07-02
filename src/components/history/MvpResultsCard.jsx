import React from 'react';
import { Trophy, Check, User } from 'lucide-react';

// Permanent MVP-vote results, shown in the round view next to the victory photo.
// Built entirely from data already on the round (mvpVotes = tally, mvpChoices =
// who picked whom) — no extra RPC / egress. Lists ONLY players who received at
// least one vote, sorted high→low, leader(s) flagged, and the viewer's own pick
// marked with ✓. `myId` is the viewer's player id (or admin voter id) so we can
// highlight their choice. Renders nothing when there are no votes yet.
export default function MvpResultsCard({ round, players, myId }) {
  const votes = round?.mvpVotes && typeof round.mvpVotes === 'object' ? round.mvpVotes : {};
  const entries = Object.entries(votes)
    .map(([pid, count]) => ({ pid, count: Number(count) || 0 }))
    .filter((e) => e.count > 0)
    .sort((a, b) => b.count - a.count);

  if (entries.length === 0) return null;

  const choices = round?.mvpChoices && typeof round.mvpChoices === 'object' ? round.mvpChoices : {};
  const myPick = myId ? choices[myId] : undefined;
  const maxVotes = entries[0].count;
  const nameOf = (id) => players.find((p) => p.id === id)?.name || 'שחקן';
  const imgOf = (id) => players.find((p) => p.id === id)?.image;
  const totalVotes = entries.reduce((s, e) => s + e.count, 0);

  return (
    <div className="rounded-2xl bg-slate-900/60 ring-1 ring-amber-400/20 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
        <Trophy className="w-4 h-4 text-amber-400" strokeWidth={2.4} />
        <span className="font-black text-white text-sm">הצבעות למצטיין המחזור</span>
        <span className="mr-auto text-ink-3 text-xs font-bold">{totalVotes} קולות</span>
      </div>

      <div className="divide-y divide-white/5">
        {entries.map(({ pid, count }) => {
          const isLeader = count === maxVotes;
          const isMine = pid === myPick;
          return (
            <div
              key={pid}
              className={`flex items-center gap-3 px-3 py-2.5 ${isMine ? 'bg-amber-500/10' : ''}`}
            >
              {imgOf(pid) ? (
                <img src={imgOf(pid)} alt="" loading="lazy" className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10 shrink-0" />
              ) : (
                <div className="grid place-items-center w-9 h-9 rounded-lg bg-slate-700 text-slate-300 shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-white text-sm truncate">{nameOf(pid)}</span>
                  {isLeader && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                </div>
                {isMine && (
                  <span className="flex items-center gap-0.5 text-amber-300 text-[0.65rem] font-black mt-0.5">
                    <Check className="w-3 h-3" strokeWidth={3} />הבחירה שלך
                  </span>
                )}
              </div>
              <span className="grid place-items-center min-w-[2rem] h-7 px-2 rounded-lg bg-slate-900/70 ring-1 ring-white/10 text-white font-black text-sm tnum shrink-0">
                {count}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
