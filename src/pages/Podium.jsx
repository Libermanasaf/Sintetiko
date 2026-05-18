import React from 'react';
import { Player } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Crown, Zap } from 'lucide-react';

export default function Podium() {
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('-wins'),
  });

  const first = players[0];
  const second = players[1];
  const third = players[2];

  const Avatar = ({ player, size = 'md', ring = 'ring-slate-600' }) => {
    const sizeClass = size === 'lg' ? 'w-16 h-16 text-2xl' : size === 'sm' ? 'w-10 h-10 text-base' : 'w-12 h-12 text-lg';
    return player?.image ? (
      <img src={player.image} alt={player.name} className={`${sizeClass} rounded-full object-cover ring-2 ${ring}`} />
    ) : (
      <div className={`${sizeClass} rounded-full bg-slate-700 flex items-center justify-center ring-2 ${ring}`}>
        <span className="font-bold text-slate-300">{player?.name?.charAt(0)}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28 max-w-lg mx-auto">
      {/* Sticky Header */}
      <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">הפודיום</h1>
        </div>
      </div>
      <div className="px-4">

      {players.length === 0 ? (
        <div className="text-center py-16">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">התחל לשחק כדי לראות את המובילים</p>
        </div>
      ) : (
        <>
          {/* Section Title */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-bold text-amber-400 uppercase tracking-widest">המניפים הגדולים</span>
            <Trophy className="w-4 h-4 text-amber-400" />
          </div>

          {/* Podium */}
          <div className="relative min-h-[380px] flex items-end justify-center gap-2 mb-10">
            {second && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex flex-col items-center">
                <div className="mb-3 bg-slate-800 border border-slate-600 rounded-2xl p-3 shadow-xl">
                  <div className="flex flex-col items-center gap-1.5">
                    <Avatar player={second} size="sm" ring="ring-slate-500" />
                    <p className="font-bold text-white text-xs text-center">{second.name}</p>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-slate-400" />
                      <span className="text-xs font-bold text-slate-300">{second.wins || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="w-20 h-28 bg-gradient-to-b from-slate-600 to-slate-700 rounded-t-2xl shadow-xl flex items-start justify-center pt-3 border border-slate-500 border-b-0">
                  <span className="text-3xl font-black text-slate-300">2</span>
                </div>
              </motion.div>
            )}
            {first && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col items-center relative z-10">
                <motion.div initial={{ rotate: -20, y: -10 }} animate={{ rotate: 0, y: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 200 }} className="mb-2">
                  <Crown className="w-8 h-8 text-amber-400 fill-amber-400" />
                </motion.div>
                <div className="mb-3 bg-gradient-to-br from-amber-900/60 to-slate-800 border-2 border-amber-400/60 rounded-2xl p-3 shadow-2xl">
                  <div className="flex flex-col items-center gap-1.5">
                    <Avatar player={first} size="lg" ring="ring-amber-400" />
                    <p className="font-black text-amber-300 text-xs text-center">{first.name}</p>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-400" />
                      <span className="text-sm font-black text-amber-300">{first.wins || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="w-24 h-44 bg-gradient-to-b from-emerald-600 to-emerald-800 rounded-t-2xl shadow-2xl flex items-start justify-center pt-4 border border-emerald-500 border-b-0">
                  <span className="text-5xl font-black text-white">1</span>
                </div>
              </motion.div>
            )}
            {third && (
              <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col items-center">
                <div className="mb-3 bg-slate-800 border border-slate-600 rounded-2xl p-3 shadow-xl">
                  <div className="flex flex-col items-center gap-1.5">
                    <Avatar player={third} size="sm" ring="ring-orange-500/50" />
                    <p className="font-bold text-white text-xs text-center">{third.name}</p>
                    <div className="flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-orange-400" />
                      <span className="text-xs font-bold text-slate-300">{third.wins || 0}</span>
                    </div>
                  </div>
                </div>
                <div className="w-20 h-20 bg-gradient-to-b from-slate-700 to-slate-800 rounded-t-2xl shadow-xl flex items-start justify-center pt-2 border border-slate-600 border-b-0">
                  <span className="text-3xl font-black text-orange-400">3</span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Full Leaderboard */}
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">דירוג מלא</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900/60">
            {/* Table header */}
            <div className="grid grid-cols-[44px_1fr_70px_70px] items-center px-4 py-2.5 bg-slate-800/80 border-b border-slate-700">
              <span className="text-xs font-bold text-slate-500 uppercase">#</span>
              <span className="text-xs font-bold text-slate-500 uppercase">שחקן</span>
              <span className="text-xs font-bold text-slate-500 uppercase text-center">גביעים</span>
              <span className="text-xs font-bold text-slate-500 uppercase text-center">הופעות</span>
            </div>
            {players.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-[44px_1fr_70px_70px] items-center px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-all duration-200 group"
              >
                <span className={`text-sm font-black ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-500' : 'text-slate-600'}`}>
                  {index + 1}
                </span>
                <div className="flex items-center gap-2.5">
                  {player.image ? (
                    <img src={player.image} alt={player.name} className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-emerald-600 transition-colors" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 group-hover:border-emerald-600 transition-colors">
                      <span className="text-xs font-bold text-slate-400">{player.name.charAt(0)}</span>
                    </div>
                  )}
                  <span className="font-semibold text-white text-sm group-hover:text-emerald-300 transition-colors">{player.name}</span>
                </div>
                <div className="flex justify-center">
                  <span className="bg-amber-500/15 text-amber-400 font-bold text-sm px-2.5 py-1 rounded-lg border border-amber-500/20">
                    {player.wins || 0}
                  </span>
                </div>
                <div className="flex justify-center">
                  <span className="text-slate-400 text-sm font-medium">{player.appearances || 0}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
}