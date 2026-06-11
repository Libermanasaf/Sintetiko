import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Trophy, Star, Zap, Heart, Skull } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Round } from '@/api/entities';

export default function PlayerStatsModal({ player, onClose, allPlayers }) {
  // Synergy is computed from recent rounds; cap at 100 so this doesn't pull the
  // entire history (which grows unbounded) every time the modal opens.
  const { data: rounds = [], isLoading: isLoadingRounds } = useQuery({
    queryKey: ['rounds-recent-100'],
    queryFn: () => Round.list('-date', 100),
    staleTime: 60_000,
  });

  if (!player) return null;

  const rank = [...allPlayers].sort((a, b) => (b.appearances || 0) - (a.appearances || 0)).findIndex(p => p.id === player.id) + 1;
  const winRate = player.appearances ? ((player.wins || 0) / player.appearances * 100).toFixed(0) : 0;

  // Calculate synergy
  const winTally = {};
  const lossTally = {};

  if (!isLoadingRounds) {
    rounds.forEach(round => {
      // Ignore rounds without a clear winner
      if (!round.teams || round.winningTeam === undefined || round.winningTeam === null) return;
      
      let playerTeamIndex = -1;
      round.teams.forEach((team, index) => {
        if (team.includes(player.id)) {
          playerTeamIndex = index;
        }
      });

      if (playerTeamIndex === -1) return; // Player didn't play in this round

      const isWin = round.winningTeam === playerTeamIndex;

      round.teams[playerTeamIndex].forEach(teammateId => {
        if (teammateId === player.id) return;

        if (isWin) {
          winTally[teammateId] = (winTally[teammateId] || 0) + 1;
        } else {
          lossTally[teammateId] = (lossTally[teammateId] || 0) + 1;
        }
      });
    });
  }

  const topLoves = Object.entries(winTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ player: allPlayers.find(p => p.id === id), count }))
    .filter(x => x.player);

  const topNightmares = Object.entries(lossTally)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ player: allPlayers.find(p => p.id === id), count }))
    .filter(x => x.player);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto"
        dir="rtl"
      >
        <div className="flex items-center justify-between sticky top-0 bg-slate-900 z-10 pb-2">
          <h3 className="text-lg font-black text-white">סטטיסטיקות שחקן</h3>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          {player.image ? (
            <img src={player.image} alt={player.name} className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-500" />
          ) : (
            <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center ring-2 ring-slate-600">
              <User className="w-7 h-7 text-slate-400" />
            </div>
          )}
          <div>
            <p className="text-xl font-black text-white">{player.name}</p>
            <div className="flex items-center gap-0.5 mt-1">
              {Array.from({ length: 5 }, (_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < Math.floor(player.rating || 3) ? 'fill-amber-400 text-amber-400' : 'text-slate-600'}`} />
              ))}
              <span className="text-sm text-slate-400 mr-1">{(player.rating || 3).toFixed(1)}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 text-center">
            <Trophy className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-amber-400">{player.wins || 0}</p>
            <p className="text-xs text-slate-400">גביעים</p>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 text-center">
            <User className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-blue-400">{player.appearances || 0}</p>
            <p className="text-xs text-slate-400">הופעות</p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <Zap className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-emerald-400">{winRate}%</p>
            <p className="text-xs text-slate-400">אחוז ניצחון</p>
          </div>
          <div className="bg-slate-700/50 border border-slate-600/40 rounded-2xl p-4 text-center">
            <Star className="w-5 h-5 text-slate-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-slate-300">#{rank}</p>
            <p className="text-xs text-slate-400">דירוג הופעות</p>
          </div>
        </div>

        {/* Synergy Section */}
        {!isLoadingRounds && (topLoves.length > 0 || topNightmares.length > 0) && (
          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-800">
            {/* My Nightmare */}
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-rose-400">
                <Skull className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">הסיוט שלי</span>
              </div>
              <div className="space-y-2">
                {topNightmares.length === 0 ? <p className="text-xs text-slate-500">אין נתונים</p> : topNightmares.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {item.player.image ? (
                        <img src={item.player.image} alt={item.player.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-slate-300 truncate">{item.player.name}</span>
                    </div>
                    <span className="text-xs font-black text-rose-400 shrink-0 bg-rose-500/10 px-1.5 py-0.5 rounded-md">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* My Love */}
            <div>
              <div className="flex items-center gap-1.5 mb-3 text-emerald-400">
                <Heart className="w-4 h-4 fill-current" />
                <span className="text-sm font-bold">אהבה שלי</span>
              </div>
              <div className="space-y-2">
                {topLoves.length === 0 ? <p className="text-xs text-slate-500">אין נתונים</p> : topLoves.map((item, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-800/50 p-1.5 rounded-lg border border-slate-700/50">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {item.player.image ? (
                        <img src={item.player.image} alt={item.player.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                          <User className="w-3 h-3 text-slate-400" />
                        </div>
                      )}
                      <span className="text-xs font-semibold text-slate-300 truncate">{item.player.name}</span>
                    </div>
                    <span className="text-xs font-black text-emerald-400 shrink-0 bg-emerald-500/10 px-1.5 py-0.5 rounded-md">{item.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
