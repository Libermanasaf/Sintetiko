import React, { useMemo } from 'react';
import { Player } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, Crown, ListOrdered } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

/* ═══════════════════════════════════════════════════════════════════
   STADIUM VIP — Tier configuration
   #1 = gold foil + shimmer + crown · #2 = silver · #3 = bronze
   ═══════════════════════════════════════════════════════════════════ */
const TIERS = {
  1: {
    cardWidth: 'w-[126px]',
    pedHeight: 'h-44',
    pedClass: 'st-foil st-sweep',
    pedRing: 'ring-1 ring-amber-300/55',
    pedNumColor: 'text-stadium',
    avatarSize: 'w-[88px] h-[88px]',
    avatarText: 'text-2xl',
    avatarRing: 'ring-amber-300',
    avatarGlow: 'shadow-[0_10px_30px_-8px_rgba(251,191,36,0.55)]',
    nameColor: 'text-amber-100',
    winTone: 'text-amber-200',
    reflection: 'rgba(251,191,36,0.55)',
    delay: 0.05,
    crown: true,
  },
  2: {
    cardWidth: 'w-[108px]',
    pedHeight: 'h-32',
    pedClass: 'bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700',
    pedRing: 'ring-1 ring-slate-300/45',
    pedNumColor: 'text-stadium',
    avatarSize: 'w-[68px] h-[68px]',
    avatarText: 'text-xl',
    avatarRing: 'ring-slate-300',
    avatarGlow: 'shadow-[0_6px_22px_-8px_rgba(203,213,225,0.4)]',
    nameColor: 'text-slate-100',
    winTone: 'text-slate-200',
    reflection: 'rgba(203,213,225,0.35)',
    delay: 0.18,
    crown: false,
  },
  3: {
    cardWidth: 'w-[108px]',
    pedHeight: 'h-24',
    pedClass: 'bg-gradient-to-b from-orange-300 via-orange-600 to-orange-900',
    pedRing: 'ring-1 ring-orange-400/45',
    pedNumColor: 'text-orange-100',
    avatarSize: 'w-[68px] h-[68px]',
    avatarText: 'text-xl',
    avatarRing: 'ring-orange-400',
    avatarGlow: 'shadow-[0_6px_22px_-8px_rgba(251,146,60,0.42)]',
    nameColor: 'text-orange-100',
    winTone: 'text-orange-200',
    reflection: 'rgba(251,146,60,0.42)',
    delay: 0.30,
    crown: false,
  },
};

/* ─── Avatar — gold-foil initial fallback ──────────────────────── */
function Avatar({ player, size, textSize, ring, glow }) {
  if (player?.image) {
    return (
      <img
        src={player.image}
        alt={player.name}
        loading="lazy"
        className={`${size} rounded-full object-cover ring-2 ${ring} ${glow}`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-slate-700 to-slate-900 grid place-items-center ring-2 ${ring} ${glow}`}>
      <span className={`font-black st-gold-text leading-none ${textSize}`}>
        {player?.name?.charAt(0) || '?'}
      </span>
    </div>
  );
}

/* ─── Top-3 card (above pedestal) ──────────────────────────────── */
function TopCard({ player, tier }) {
  const winRate = (player.appearances || 0) > 0
    ? Math.round((player.wins / player.appearances) * 100)
    : null;
  return (
    <div className={`relative ${tier.cardWidth} st-card`}>
      <div className="flex flex-col items-center px-2 py-3">
        <Avatar
          player={player}
          size={tier.avatarSize}
          textSize={tier.avatarText}
          ring={tier.avatarRing}
          glow={tier.avatarGlow}
        />
        <p className={`mt-2 font-black text-[0.8rem] text-center leading-tight truncate max-w-[108px] ${tier.nameColor}`}>
          {player.name}
        </p>
        <div className="mt-1 flex items-center gap-1">
          <Trophy className={`w-3.5 h-3.5 ${tier.winTone}`} strokeWidth={2.6} fill="currentColor" />
          <span className={`tnum font-black text-base leading-none ${tier.winTone}`}>
            {player.wins || 0}
          </span>
        </div>
        {winRate != null && (
          <span className="mt-0.5 text-[0.6rem] font-black tnum text-ink-3 tracking-wide">
            {winRate}%
            <span className="opacity-60 mx-1">·</span>
            {player.appearances} משחקים
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Pedestal block with floor reflection ─────────────────────── */
function Pedestal({ place, tier }) {
  return (
    <div className={`${tier.cardWidth} ${tier.pedHeight} relative -mt-0.5`}>
      {/* the pedestal itself */}
      <div className={`absolute inset-0 rounded-t-xl ${tier.pedRing} ${tier.pedClass} shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] overflow-hidden`}>
        {/* tier-colored radial highlight (faint, near top) */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1/2 opacity-50"
          style={{ background: 'radial-gradient(60% 80% at 50% 0%, rgba(255,255,255,0.35), transparent 70%)' }}
          aria-hidden
        />
        <div className={`absolute inset-x-0 top-3 text-center font-black text-5xl ${tier.pedNumColor} leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.3)]`}>
          {place}
        </div>
      </div>
      {/* soft floor reflection */}
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-2.5 inset-x-1.5 h-2.5 rounded-full blur-md opacity-60"
        style={{ background: tier.reflection }}
      />
    </div>
  );
}

/* ─── Full podium column (card + pedestal stack) ───────────────── */
function PodiumColumn({ player, place }) {
  const tier = TIERS[place];
  return (
    <motion.div
      initial={{ opacity: 0, y: 36 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: tier.delay, type: 'spring', damping: 20, stiffness: 180 }}
      className={`flex flex-col items-center ${place === 1 ? 'relative z-10' : ''}`}
    >
      {tier.crown && (
        <motion.div
          initial={{ y: -10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: tier.delay + 0.3, type: 'spring', stiffness: 240 }}
          className="mb-2 st-float drop-shadow-[0_0_18px_rgba(251,191,36,0.6)]"
        >
          <Crown className="w-10 h-10 text-amber-300" strokeWidth={1.8} fill="currentColor" />
        </motion.div>
      )}
      <TopCard player={player} tier={tier} />
      <Pedestal place={place} tier={tier} />
    </motion.div>
  );
}

/* ─── Eyebrow title with gold-rule lines on both sides ─────────── */
function Eyebrow({ icon: Icon, children }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-5">
      <div className="st-rule flex-1 max-w-[88px]" />
      <div className="flex items-center gap-1.5 shrink-0">
        {Icon && <Icon className="w-4 h-4 text-amber-400" fill="currentColor" />}
        <span className="text-[0.72rem] font-black tracking-[0.28em] text-amber-300/90 uppercase whitespace-nowrap">
          {children}
        </span>
        {Icon && <Icon className="w-4 h-4 text-amber-400" fill="currentColor" />}
      </div>
      <div className="st-rule flex-1 max-w-[88px]" />
    </div>
  );
}

/* ─── Leaderboard row ──────────────────────────────────────────── */
function RankRow({ player, idx }) {
  const place = idx + 1;
  const isGold = place === 1;
  const isSilver = place === 2;
  const isBronze = place === 3;
  const isTop3 = isGold || isSilver || isBronze;

  const rankColor =
    isGold ? 'text-amber-300'
    : isSilver ? 'text-slate-200'
    : isBronze ? 'text-orange-300'
    : 'text-slate-500';

  const pillClass =
    isGold ? 'bg-amber-500/15 text-amber-200 ring-amber-400/45'
    : isSilver ? 'bg-slate-400/12 text-slate-100 ring-slate-300/35'
    : isBronze ? 'bg-orange-500/15 text-orange-200 ring-orange-400/40'
    : 'bg-slate-700/40 text-slate-200 ring-white/8';

  const rowBg =
    isGold ? 'bg-gradient-to-l from-amber-500/12 via-amber-500/4 to-transparent'
    : isSilver ? 'bg-gradient-to-l from-slate-400/10 via-slate-400/3 to-transparent'
    : isBronze ? 'bg-gradient-to-l from-orange-500/10 via-orange-500/3 to-transparent'
    : idx % 2 ? 'bg-slate-900/35' : 'bg-slate-900/15';

  const winRate = (player.appearances || 0) > 0
    ? Math.round((player.wins / player.appearances) * 100)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(idx * 0.025, 0.4) }}
      className={`grid grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-3 border-b border-slate-800/50 last:border-b-0 ${rowBg}`}
    >
      <span className={`text-lg font-black tnum text-center ${rankColor}`}>{place}</span>
      <div className="flex items-center gap-2.5 min-w-0">
        {player.image ? (
          <img
            src={player.image}
            alt={player.name}
            loading="lazy"
            className={`w-9 h-9 rounded-full object-cover shrink-0 ring-1 ${
              isGold ? 'ring-amber-400/60'
              : isSilver ? 'ring-slate-300/50'
              : isBronze ? 'ring-orange-400/50'
              : 'ring-white/10'
            }`}
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-900 grid place-items-center ring-1 ring-white/8 shrink-0">
            <span className="text-xs font-black st-gold-text">{player.name?.charAt(0) || '?'}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className={`font-black text-sm truncate ${isTop3 ? 'text-white' : 'text-slate-200'}`}>
            {player.name}
          </p>
          {winRate != null && (
            <p className="text-[0.62rem] text-ink-3 font-bold tnum mt-0.5">
              <span>{player.appearances} משחקים</span>
              <span className="mx-1.5 opacity-50">·</span>
              <span className="text-amber-400/80">{winRate}%</span>
            </p>
          )}
        </div>
      </div>
      <span className={`tnum font-black text-base px-3 py-1.5 rounded-lg ring-1 ${pillClass} shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]`}>
        {player.wins || 0}
      </span>
    </motion.div>
  );
}

/* ─── Loading state ────────────────────────────────────────────── */
function LoadingState() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-80 rounded-2xl" />
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
      <Skeleton className="h-14 rounded-xl" />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PAGE
   ═══════════════════════════════════════════════════════════════════ */
export default function Podium() {
  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('-wins'),
  });

  // Stable ordering: wins desc → appearances desc → name asc (Hebrew)
  const ranked = useMemo(() => {
    return [...players].sort((a, b) => {
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      if ((b.appearances || 0) !== (a.appearances || 0)) return (b.appearances || 0) - (a.appearances || 0);
      return (a.name || '').localeCompare(b.name || '', 'he');
    });
  }, [players]);

  const totalWins = useMemo(() => ranked.reduce((s, p) => s + (p.wins || 0), 0), [ranked]);
  const [first, second, third] = ranked;

  return (
    <div className="pb-10 max-w-lg mx-auto">
      <PageHeader
        icon={Trophy}
        title="הפודיום"
        subtitle={ranked.length ? `${ranked.length} שחקנים · ${totalWins} ניצחונות` : 'טבלת המנצחים'}
        accent="amber"
      />

      <div className="px-4 mt-5">
        {isLoading ? (
          <LoadingState />
        ) : !ranked.length ? (
          <EmptyState
            icon={Trophy}
            title="הפודיום עוד ריק"
            hint="ברגע שיירשמו ניצחונות, המובילים יופיעו כאן."
          />
        ) : (
          <>
            {/* ─── Cinematic hero podium ────────────────────────── */}
            <div className="relative -mx-4 mb-9 overflow-hidden">
              {/* Spotlight from above */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 top-0 h-full"
                style={{ background: 'radial-gradient(80% 60% at 50% -10%, rgba(251,191,36,0.20), transparent 62%)' }}
              />
              {/* Mowed pitch stripes */}
              <div aria-hidden className="pointer-events-none absolute inset-0 st-pitch-lines" />

              <div className="relative z-10 px-4 pt-3 pb-9">
                <Eyebrow icon={Crown}>המנצחים הגדולים</Eyebrow>

                {/* Podium stage — order in RTL flex: first child appears on RIGHT */}
                <div className="flex items-end justify-center gap-2.5 min-h-[340px]">
                  {second && <PodiumColumn player={second} place={2} />}
                  {first  && <PodiumColumn player={first}  place={1} />}
                  {third  && <PodiumColumn player={third}  place={3} />}
                </div>

                {/* Floor lines — two-step gradient gives stage depth */}
                <div className="mt-3 mx-4 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
                <div className="mt-1.5 mx-12 h-px bg-gradient-to-r from-transparent via-amber-400/22 to-transparent" />
              </div>
            </div>

            {/* ─── Full ranking ──────────────────────────────────── */}
            <Eyebrow icon={ListOrdered}>דירוג מלא</Eyebrow>

            <div className="rounded-2xl overflow-hidden ring-1 ring-amber-500/15 bg-slate-900/60 shadow-[0_20px_45px_-25px_rgba(0,0,0,0.75)]">
              {/* Column headers */}
              <div className="grid grid-cols-[36px_1fr_auto] items-center gap-3 px-4 py-2.5 bg-slate-800/70 border-b border-amber-500/20">
                <span className="text-[0.65rem] font-black text-amber-400/85 text-center tracking-wider">#</span>
                <span className="text-[0.65rem] font-black text-amber-400/85 tracking-wider">שחקן</span>
                <span className="text-[0.65rem] font-black text-amber-400/85 tracking-wider">נצחונות</span>
              </div>
              {ranked.map((player, idx) => (
                <RankRow key={player.id} player={player} idx={idx} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
