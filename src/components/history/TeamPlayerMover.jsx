import React, { useState } from 'react';
import { ArrowLeftRight, X, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TEAM_COLORS = [
  { header: 'bg-yellow-500', card: 'bg-yellow-100', border: 'border-yellow-400', text: 'text-yellow-800' },
  { header: 'bg-blue-700', card: 'bg-blue-100', border: 'border-blue-400', text: 'text-blue-800' },
  { header: 'bg-orange-600', card: 'bg-orange-100', border: 'border-orange-400', text: 'text-orange-800' },
];

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים'];

export default function TeamPlayerMover({ round, players, onSave, onClose }) {
  const [teams, setTeams] = useState(round.teams.map(t => [...t]));
  const [dragging, setDragging] = useState(null);
  // { playerId, teamIndex } - the player slot being replaced
  const [replacing, setReplacing] = useState(null);

  const handleDragStart = (playerId, fromTeam) => {
    setDragging({ playerId, fromTeam });
  };

  const handleDrop = (toTeam) => {
    if (!dragging || dragging.fromTeam === toTeam) return;
    const { playerId, fromTeam } = dragging;
    setTeams(prev => {
      const next = prev.map(t => [...t]);
      next[fromTeam] = next[fromTeam].filter(id => id !== playerId);
      next[toTeam] = [...next[toTeam], playerId];
      return next;
    });
    setDragging(null);
  };

  const handlePlayerClick = (playerId, teamIndex) => {
    setReplacing({ playerId, teamIndex });
  };

  const handleReplaceWith = (newPlayerId) => {
    if (!replacing) return;
    const { playerId: oldPlayerId, teamIndex } = replacing;

    setTeams(prev => {
      const next = prev.map(t => [...t]);
      // Find if newPlayer already exists in any team
      let newPlayerTeam = -1;
      let newPlayerIdx = -1;
      next.forEach((team, ti) => {
        const idx = team.indexOf(newPlayerId);
        if (idx !== -1) {
          newPlayerTeam = ti;
          newPlayerIdx = idx;
        }
      });

      const oldIdx = next[teamIndex].indexOf(oldPlayerId);

      if (newPlayerTeam !== -1) {
        // Swap the two players
        next[newPlayerTeam][newPlayerIdx] = oldPlayerId;
        next[teamIndex][oldIdx] = newPlayerId;
      } else {
        // Replace old player with new one
        next[teamIndex][oldIdx] = newPlayerId;
      }

      return next;
    });

    setReplacing(null);
  };

  const assignedPlayerIds = new Set(teams.flat());

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-5 h-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-800">העברת שחקנים בין קבוצות</h2>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <p className="text-sm text-slate-500 px-4 pt-3 pb-1">גרור שחקן בין קבוצות, או לחץ על שמו להחלפה ידנית</p>

        <div className="p-4 grid grid-cols-3 gap-3">
          {teams.map((teamPlayerIds, teamIndex) => {
            const color = TEAM_COLORS[teamIndex % TEAM_COLORS.length];
            return (
              <div
                key={teamIndex}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => handleDrop(teamIndex)}
                className={`rounded-xl border-2 ${color.border} min-h-[120px] overflow-hidden`}
              >
                <div className={`${color.header} text-white text-center text-sm font-bold py-2`}>
                  {TEAM_NAMES[teamIndex % TEAM_NAMES.length]}
                  <span className="ml-1 opacity-80">({teamPlayerIds.length})</span>
                </div>
                <div className="p-2 space-y-1.5">
                  {teamPlayerIds.map(playerId => {
                    const player = players.find(p => p.id === playerId);
                    if (!player) return null;
                    const isSelected = replacing?.playerId === playerId && replacing?.teamIndex === teamIndex;
                    return (
                      <div
                        key={playerId}
                        draggable
                        onDragStart={() => handleDragStart(playerId, teamIndex)}
                        onClick={() => handlePlayerClick(playerId, teamIndex)}
                        className={`${color.card} ${color.text} rounded-lg px-2 py-1.5 text-sm font-medium cursor-pointer select-none flex items-center gap-1.5 transition-all
                          ${isSelected ? 'ring-2 ring-emerald-500 scale-105' : 'hover:brightness-95'}`}
                      >
                        <span className="text-xs opacity-60">⠿</span>
                        {player.name}
                        {isSelected && <span className="mr-auto text-emerald-600 text-xs font-bold">✓</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Player picker when replacing */}
        {replacing && (
          <div className="mx-4 mb-4 border border-emerald-200 rounded-xl bg-emerald-50 overflow-hidden">
            <div className="bg-emerald-600 text-white text-sm font-bold px-4 py-2 flex items-center justify-between">
              <span>
                החלף את "{players.find(p => p.id === replacing.playerId)?.name}" עם:
              </span>
              <button onClick={() => setReplacing(null)} className="text-white/70 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
              {players
                .filter(p => p.id !== replacing.playerId)
                .map(player => {
                  const isInTeam = assignedPlayerIds.has(player.id);
                  return (
                    <button
                      key={player.id}
                      onClick={() => handleReplaceWith(player.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-right transition-all
                        ${isInTeam
                          ? 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400 hover:bg-emerald-50'
                          : 'bg-slate-100 border border-slate-300 text-slate-500 hover:bg-emerald-100 hover:border-emerald-400'
                        }`}
                    >
                      {player.image ? (
                        <img src={player.image} alt={player.name} className="w-6 h-6 rounded-full object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                      <span className="flex-1">{player.name}</span>
                      {!isInTeam && <span className="text-xs text-slate-400">חיצוני</span>}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

        <div className="p-4 border-t flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>ביטול</Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700"
            onClick={() => onSave(teams)}
          >
            שמור סידור
          </Button>
        </div>
      </div>
    </div>
  );
}