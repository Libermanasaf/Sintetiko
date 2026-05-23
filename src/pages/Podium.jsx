import React from 'react';
import { Player } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Crown, ListOrdered } from 'lucide-react';
import { PageHeader, SectionTitle, EmptyState, Skeleton } from '@/components/ui/lux';

const RANK_TEXT = ['text-amber-300', 'text-slate-300', 'text-orange-400'];

function Avatar({ player, size = 'md', ring = 'ring-slate-600' }) {
  const sizeClass =
    size === 'lg' ? 'w-[68px] h-[68px] text-2xl'
    : size === 'sm' ? 'w-11 h-11 text-base'
    : 'w-12 h-12 text-lg';
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

function PodiumStep({ player, place, delay }) {
  const config = {
    1: {
      ped: 'h-40 bg-gradient-to-b from-amber-400 to-amber-700 ring-amber-300/50',
      num: 'text-stadium', cardRing: 'ring-amber-400/60', cardBg: 'from-amber-900/55 to-slate-900',
      avatarRing: 'ring-amber-400', name: 'text-amber-200', winText: 'text-amber-300',
      winIcon: 'text-amber-400', w: 'w-[88px]',
    },
    2: {
      ped: 'h-28 bg-gradient-to-b from-slate-400 to-slate-600 ring-slate-300/40',
      num: 'text-stadium', cardRing: 'ring-slate-400/40', cardBg: 'from-slate-800 to-slate-900',
      avatarRing: 'ring-slate-400', name: 'text-white', winText: 'text-slate-200',
      winIcon: 'text-slate-300', w: 'w-[78px]',
    },
    3: {
      ped: 'h-[72px] bg-gradient-to-b from-orange-600 to-orange-900 ring-orange-400/40',
      num: 'text-orange-100', cardRing: 'ring-orange-500/40', cardBg: 'from-slate-800 to-slate-900',
      avatarRing: 'ring-orange-500/60', name: 'text-white', winText: 'text-orange-300',
      winIcon: 'text-orange-400', w: 'w-[78px]',
    },
  }[place];

  return (
    <motion.div
      initial={{ opacity: 0, y: 44 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 20, stiffness: 180 }}
      className={`flex flex-col items-center ${place === 1 ? 'relative z-10' : ''}`}
    >
      {place === 1 && (
        <motion.div
          initial={{ rotate: -18, y: -8, opacity: 0 }}
          animate={{ rotate: 0, y: 0, opacity: 1 }}
          transition={{ delay: delay + 0.3, type: 'spring', stiffness: 220 }}
          className="mb-1.5"
        >
          <Crown className="w-8 h-8 text-amber-400 fill-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.6)]" />
        </motion.div>
      )}
      <div className={`mb-3 rounded-2xl p-3 bg-gradient-to-br ${config.cardBg} ring-1 ${config.cardRing} shadow-xl`}>
        <div className="flex flex-col items-center gap-1.5">
          <Avatar player={player} size={place === 1 ? 'lg' : 'sm'} ring={config.avatarRing} />
          <p className={`font-black text-xs text-center leading-tight max-w-[80px] truncate ${config.name}`}>
            {player.name}
          </p>
          <div className="flex items-center gap-1">
            <Trophy className={`w-3 h-3 ${config.winIcon}`} />
            <span className={`tnum font-black text-sm ${config.winText}`}>{player.wins || 0}</span>
          </div>
        </div>
      </div>
      <div className={`${config.w} ${config.ped} rounded-t-xl ring-1 grid place-items-start justify-center pt-3 shadow-2xl`}>
        <span className={`text-4xl font-black ${config.num}`}>{place}</span>
      </div>
    </motion.div>
  );
}

export default function Podium() {
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('-wins'),
  });

  const [first, second, third] = players;

  return (
    <div className="pb-10 max-w-lg mx-auto">
      <PageHeader
        icon={Trophy}
        title="הפודיום"
        subtitle={players.length ? `${players.length} שחקנים בדירוג` : 'טבלת המנצחים'}
        accent="amber"
      />

      <div className="px-4 mt-5">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        ) : players.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title="הפודיום עוד ריק"
            hint="ברגע שיירשמו ניצחונות, המובילים יופיעו כאן."
          />
        ) : (
          <>
            <SectionTitle icon={Crown} className="mb-6">המנצחים הגדולים</SectionTitle>

            <div className="flex items-end justify-center gap-2 mb-9 min-h-[320px]">
              {second && <PodiumStep player={second} place={2} delay={0.16} />}
              {first && <PodiumStep player={first} place={1} delay={0.05} />}
              {third && <PodiumStep player={third} place={3} delay={0.27} />}
            </div>

            <SectionTitle icon={ListOrdered} className="mb-4">דירוג מלא</SectionTitle>

            <div className="rounded-2xl overflow-hidden ring-1 ring-amber-500/15 bg-slate-900/60">
              <div className="grid grid-cols-[40px_1fr_60px_60px] items-center px-4 py-2.5 bg-slate-800/80 border-b border-amber-500/15">
                <span className="text-[0.7rem] font-black text-amber-400/80">#</span>
                <span className="text-[0.7rem] font-black text-amber-400/80">שחקן</span>
                <span className="text-[0.7rem] font-black text-amber-400/80 text-center">נצחונות</span>
                <span className="text-[0.7rem] font-black text-amber-400/80 text-center">הופעות</span>
              </div>
              {players.map((player, index) => (
                <motion.div
                  key={player.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(index * 0.03, 0.4) }}
                  className="grid grid-cols-[40px_1fr_60px_60px] items-center px-4 py-3 border-b border-slate-800/80 last:border-b-0"
                >
                  <span className={`text-sm font-black tnum ${RANK_TEXT[index] || 'text-slate-600'}`}>
                    {index + 1}
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
                    <span className="font-bold text-white text-sm truncate">{player.name}</span>
                  </div>
                  <div className="flex justify-center">
                    <span className="tnum bg-amber-500/12 text-amber-300 font-black text-sm px-2.5 py-1 rounded-lg ring-1 ring-amber-500/25">
                      {player.wins || 0}
                    </span>
                  </div>
                  <span className="tnum text-ink-2 text-sm font-bold text-center">
                    {player.appearances || 0}
                  </span>
                </motion.div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
