import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, User, Crown, Zap } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Player } from '@/api/entities';
import PlayerStatsModal from '@/components/statistics/PlayerStatsModal';
import { PageHeader } from '@/components/ui/lux';

export default function Statistics() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('-appearances'),
  });

  const byAppearances = [...players].sort((a, b) => (b.appearances || 0) - (a.appearances || 0));

  const byEfficiency = [...players]
    .filter(p => (p.appearances || 0) >= 5)
    .sort((a, b) => {
      const effA = (a.wins || 0) / (a.appearances || 1);
      const effB = (b.wins || 0) / (b.appearances || 1);
      return effB - effA;
    });

  const effFirst = byEfficiency[0];
  const effSecond = byEfficiency[1];
  const effThird = byEfficiency[2];
  const appFirst = byAppearances[0];
  const appSecond = byAppearances[1];
  const appThird = byAppearances[2];

  const effRate = (p) => p ? ((p.wins || 0) / (p.appearances || 1) * 100).toFixed(0) + '%' : '';

  const Avatar = ({ player, size = 'md', ring = 'ring-slate-600' }) => {
    const sizeClass = size === 'lg' ? 'w-14 h-14 text-xl' : size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base';
    return player?.image ? (
      <img src={player.image} alt={player.name} className={`${sizeClass} rounded-full object-cover ring-2 ${ring}`} />
    ) : (
      <div className={`${sizeClass} rounded-full bg-slate-700 flex items-center justify-center ring-2 ${ring}`}>
        <span className="font-bold text-slate-300">{player?.name?.charAt(0)}</span>
      </div>
    );
  };

  const PodiumBlock = ({ player, rank, stat, statIcon, accentColor, height, cardBorder }) => (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank === 1 ? 0.1 : rank === 2 ? 0.2 : 0.3 }}
      className="flex flex-col items-center"
    >
      {rank === 1 && (
        <motion.div initial={{ rotate: -20 }} animate={{ rotate: 0 }} transition={{ delay: 0.5, type: 'spring', stiffness: 200 }} className="mb-1">
          <Crown className={`w-6 h-6 ${accentColor} fill-current`} />
        </motion.div>
      )}
      <div className={`mb-2 bg-slate-800 border ${cardBorder} rounded-2xl p-2.5 shadow-xl`}>
        <div className="flex flex-col items-center gap-1">
          <Avatar player={player} size={rank === 1 ? 'md' : 'sm'} ring={cardBorder.replace('border-', 'ring-')} />
          <p className="font-bold text-white text-xs text-center leading-tight">{player.name}</p>
          <div className="flex items-center gap-1">
            {statIcon}
            <span className="text-xs font-bold text-emerald-400">{stat}</span>
          </div>
        </div>
      </div>
      <div
        className={`w-16 rounded-t-xl shadow-xl flex items-start justify-center pt-2 border border-b-0 ${
          rank === 1 ? 'bg-gradient-to-b from-emerald-600 to-emerald-800 border-emerald-500' :
          rank === 2 ? 'bg-gradient-to-b from-slate-600 to-slate-700 border-slate-500' :
          'bg-gradient-to-b from-slate-700 to-slate-800 border-slate-600'
        }`}
        style={{ height }}
      >
        <span className={`font-black ${rank === 1 ? 'text-3xl text-white' : 'text-2xl text-slate-300'}`}>{rank}</span>
      </div>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="pb-28">
      <PageHeader icon={BarChart3} title="סטטיסטיקות" accent="emerald" />
      <div className="px-4 mt-6">

      {players.length === 0 ? (
        <div className="text-center py-16">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-slate-400">הוסף שחקנים כדי לראות סטטיסטיקות</p>
        </div>
      ) : (
        <>
          {/* Two Podiums */}
          <div className="flex gap-3 mb-10">
            {/* Efficiency Podium */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center gap-1.5 mb-5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">שחקנים יעילים</span>
              </div>
              <div className="flex items-end justify-center gap-1.5 pb-2" style={{ minHeight: 280 }}>
                {effSecond && <PodiumBlock player={effSecond} rank={2} stat={effRate(effSecond)} statIcon={<Zap className="w-3 h-3 text-emerald-400" />} accentColor="text-slate-400" height="80px" cardBorder="border-slate-600" />}
                {effFirst && <PodiumBlock player={effFirst} rank={1} stat={effRate(effFirst)} statIcon={<Zap className="w-3 h-3 text-emerald-400" />} accentColor="text-emerald-400" height="120px" cardBorder="border-emerald-500/60" />}
                {effThird && <PodiumBlock player={effThird} rank={3} stat={effRate(effThird)} statIcon={<Zap className="w-3 h-3 text-emerald-400" />} accentColor="text-orange-400" height="56px" cardBorder="border-slate-700" />}
              </div>
            </div>

            {/* Divider */}
            <div className="w-px bg-slate-800 self-stretch" />

            {/* Appearances Podium */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-center gap-1.5 mb-5">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">שיאני הופעות</span>
              </div>
              <div className="flex items-end justify-center gap-1.5 pb-2" style={{ minHeight: 280 }}>
                {appSecond && <PodiumBlock player={appSecond} rank={2} stat={String(appSecond.appearances || 0)} statIcon={<Users className="w-3 h-3 text-blue-400" />} accentColor="text-slate-400" height="80px" cardBorder="border-slate-600" />}
                {appFirst && <PodiumBlock player={appFirst} rank={1} stat={String(appFirst.appearances || 0)} statIcon={<Users className="w-3 h-3 text-blue-400" />} accentColor="text-blue-400" height="120px" cardBorder="border-blue-500/60" />}
                {appThird && <PodiumBlock player={appThird} rank={3} stat={String(appThird.appearances || 0)} statIcon={<Users className="w-3 h-3 text-blue-400" />} accentColor="text-orange-400" height="56px" cardBorder="border-slate-700" />}
              </div>
            </div>
          </div>

          {/* Full Leaderboard */}
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-bold text-blue-400 uppercase tracking-widest">טבלת הופעות מלאה</span>
          </div>
          <div className="rounded-2xl overflow-hidden border border-amber-500/15 bg-slate-900/60 shadow-xl shadow-black/30">
            <div className="grid grid-cols-[44px_1fr_80px] items-center px-4 py-2.5 bg-gradient-to-l from-slate-800 to-slate-800/60 border-b border-amber-500/15">
              <span className="text-xs font-black text-amber-400/80 uppercase">#</span>
              <span className="text-xs font-black text-amber-400/80 uppercase">שחקן</span>
              <span className="text-xs font-black text-amber-400/80 uppercase text-center">הופעות</span>
            </div>
            {byAppearances.map((player, index) => (
              <motion.div
                key={player.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
                className="grid grid-cols-[44px_1fr_80px] items-center px-4 py-3 border-b border-slate-800 last:border-b-0 hover:bg-slate-800/50 transition-all duration-200 group"
              >
                <span className={`text-sm font-black ${index === 0 ? 'text-amber-400' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-orange-500' : 'text-slate-600'}`}>
                  {index + 1}
                </span>
                <div className="flex items-center gap-2.5">
                  {player.image ? (
                    <img src={player.image} alt={player.name} className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-blue-600 transition-colors" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                    </div>
                  )}
                  <button
                    onClick={() => setSelectedPlayer(player)}
                    className="font-semibold text-white text-sm hover:text-emerald-400 transition-colors"
                  >
                    {player.name}
                  </button>
                </div>
                <div className="flex justify-center">
                  <span className="bg-blue-500/15 text-blue-400 font-bold text-sm px-2.5 py-1 rounded-lg border border-blue-500/20">
                    {player.appearances || 0}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {selectedPlayer && (
        <PlayerStatsModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} allPlayers={players} />
      )}
      </div>
    </div>
  );
}