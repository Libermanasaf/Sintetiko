import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Users, Crown, Zap, ListOrdered, Search, X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Player } from '@/api/entities';
import PlayerStatsModal from '@/components/statistics/PlayerStatsModal';
import { PageHeader, SectionTitle, EmptyState, Skeleton } from '@/components/ui/lux';

const RANK_TEXT = ['text-amber-300', 'text-slate-300', 'text-orange-400'];

function Avatar({ player, size = 'md', ring = 'ring-slate-600' }) {
  const sizeClass = size === 'lg' ? 'w-12 h-12 text-lg' : 'w-9 h-9 text-sm';
  return player?.image ? (
    <img
      src={player.image}
      alt={player.name}
      loading="lazy"
      className={`${sizeClass} rounded-full object-cover ring-2 ${ring}`}
    />
  ) : (
    <div className={`${sizeClass} rounded-full bg-slate-700 grid place-items-center ring-2 ${ring}`}>
      <span className="font-black text-slate-300">{player?.name?.charAt(0)}</span>
    </div>
  );
}

function MiniPodiumStep({ player, rank, stat, tone, delay }) {
  const tones = {
    emerald: { ring1: 'ring-emerald-400/60', ped1: 'from-emerald-500 to-emerald-800', stat: 'text-emerald-300', crown: 'text-emerald-400' },
    sky:     { ring1: 'ring-sky-400/60', ped1: 'from-sky-500 to-sky-800', stat: 'text-sky-300', crown: 'text-sky-400' },
  }[tone];
  const isFirst = rank === 1;
  const pedBase = isFirst
    ? `bg-gradient-to-b ${tones.ped1}`
    : rank === 2 ? 'bg-gradient-to-b from-slate-500 to-slate-700'
    : 'bg-gradient-to-b from-orange-700 to-orange-900';
  const h = isFirst ? 'h-[110px]' : rank === 2 ? 'h-[74px]' : 'h-[52px]';
  const ring = isFirst ? tones.ring1 : rank === 2 ? 'ring-slate-400' : 'ring-orange-500/60';

  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 20, stiffness: 190 }}
      className="flex flex-col items-center min-w-0"
    >
      {isFirst && (
        <Crown className={`w-5 h-5 mb-1 fill-current ${tones.crown}`} />
      )}
      <div className="mb-2 rounded-xl p-2 bg-slate-800/90 ring-1 ring-white/8 shadow-lg w-full">
        <div className="flex flex-col items-center gap-1">
          <Avatar player={player} size={isFirst ? 'lg' : 'sm'} ring={ring} />
          <p className="font-black text-white text-[0.66rem] text-center leading-tight truncate max-w-full">
            {player.name}
          </p>
          <span className={`tnum font-black text-xs ${tones.stat}`}>{stat}</span>
        </div>
      </div>
      <div className={`w-14 ${h} ${pedBase} rounded-t-lg ring-1 ring-white/10 grid place-items-start justify-center pt-1.5 shadow-xl`}>
        <span className={`font-black ${isFirst ? 'text-2xl text-white' : 'text-lg text-slate-200'}`}>{rank}</span>
      </div>
    </motion.div>
  );
}

function MiniPodium({ title, icon: Icon, players, tone, statFn }) {
  const [a, b, c] = players;
  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-center gap-1.5 mb-4">
        <Icon className={`w-3.5 h-3.5 ${tone === 'emerald' ? 'text-emerald-400' : 'text-sky-400'}`} strokeWidth={2.5} />
        <span className={`text-[0.66rem] font-black uppercase tracking-wider ${tone === 'emerald' ? 'text-emerald-300' : 'text-sky-300'}`}>
          {title}
        </span>
      </div>
      <div className="flex items-end justify-center gap-1.5 min-h-[220px]">
        {b && <MiniPodiumStep player={b} rank={2} stat={statFn(b)} tone={tone} delay={0.16} />}
        {a && <MiniPodiumStep player={a} rank={1} stat={statFn(a)} tone={tone} delay={0.05} />}
        {c && <MiniPodiumStep player={c} rank={3} stat={statFn(c)} tone={tone} delay={0.27} />}
      </div>
    </div>
  );
}

export default function Statistics() {
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [search, setSearch] = useState('');
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('-appearances'),
  });

  const byAppearances = [...players].sort((a, b) => (b.appearances || 0) - (a.appearances || 0));
  // Keep each player's true rank, then filter the view by name — so searching
  // narrows the rows shown but the # column still reflects the real ranking.
  const rankedRows = useMemo(() => {
    const ranked = byAppearances.map((p, i) => ({ player: p, rank: i }));
    const q = search.trim().toLowerCase();
    if (!q) return ranked;
    return ranked.filter(({ player }) => (player.name || '').toLowerCase().includes(q));
  }, [byAppearances, search]);
  const byEfficiency = [...players]
    .filter(p => (p.appearances || 0) >= 5)
    .sort((a, b) => (b.wins || 0) / (b.appearances || 1) - (a.wins || 0) / (a.appearances || 1));

  const effRate = (p) => `${((p.wins || 0) / (p.appearances || 1) * 100).toFixed(0)}%`;
  const appCount = (p) => String(p.appearances || 0);

  return (
    <div className="pb-10">
      <PageHeader
        icon={BarChart3}
        title="סטטיסטיקות"
        subtitle={players.length ? `${players.length} שחקנים` : 'נתוני המועדון'}
        accent="emerald"
      />

      <div className="px-4 mt-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-64 rounded-2xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        ) : players.length === 0 ? (
          <EmptyState
            icon={BarChart3}
            title="אין עדיין נתונים"
            hint="הוסף שחקנים ושחק מחזורים כדי לראות סטטיסטיקות."
          />
        ) : (
          <>
            <div className="flex gap-2 mb-8 rounded-2xl bg-slate-900/50 ring-1 ring-white/5 p-3">
              <MiniPodium title="שחקנים יעילים" icon={Zap} players={byEfficiency} tone="emerald" statFn={effRate} />
              <div className="w-px bg-slate-800 self-stretch" />
              <MiniPodium title="שיאני הופעות" icon={Users} players={byAppearances} tone="sky" statFn={appCount} />
            </div>

            <SectionTitle icon={ListOrdered} className="mb-4">טבלת הופעות מלאה</SectionTitle>

            {/* Search by name */}
            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="חיפוש שחקן לפי שם"
                className="w-full min-h-[48px] pr-10 pl-10 rounded-xl bg-slate-900/70 ring-1 ring-white/8 text-slate-200 placeholder:text-slate-500 font-medium focus:ring-amber-400/40 focus:outline-none transition-all"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  aria-label="נקה חיפוש"
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid place-items-center w-8 h-8 rounded-lg text-slate-400 hover:text-white active:scale-90 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="rounded-2xl overflow-hidden ring-1 ring-amber-500/15 bg-slate-900/60">
              <div className="grid grid-cols-[40px_1fr_72px] items-center px-4 py-2.5 bg-slate-800/80 border-b border-amber-500/15">
                <span className="text-[0.7rem] font-black text-amber-400/80">#</span>
                <span className="text-[0.7rem] font-black text-amber-400/80">שחקן</span>
                <span className="text-[0.7rem] font-black text-amber-400/80 text-center">הופעות</span>
              </div>
              {rankedRows.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-sm font-bold">
                  לא נמצא שחקן בשם "{search}"
                </div>
              ) : rankedRows.map(({ player, rank }, i) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.4) }}
                  className="grid grid-cols-[40px_1fr_72px] items-center px-4 py-3 border-b border-slate-800/80 last:border-b-0"
                >
                  <span className={`text-sm font-black tnum ${RANK_TEXT[rank] || 'text-slate-600'}`}>
                    {rank + 1}
                  </span>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {player.image ? (
                      <img
                        src={player.image}
                        alt={player.name}
                        loading="lazy"
                        className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-700 grid place-items-center ring-1 ring-slate-600 shrink-0">
                        <span className="text-xs font-black text-slate-400">{player.name.charAt(0)}</span>
                      </div>
                    )}
                    <button
                      onClick={() => setSelectedPlayer(player)}
                      className="font-bold text-white text-sm truncate hover:text-emerald-300 transition-colors"
                    >
                      {player.name}
                    </button>
                  </div>
                  <div className="flex justify-center">
                    <span className="tnum bg-sky-500/12 text-sky-300 font-black text-sm px-2.5 py-1 rounded-lg ring-1 ring-sky-500/25">
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
