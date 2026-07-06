import React, { useMemo, useState, useEffect } from 'react';
import { Player } from '@/api/entities';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion, animate } from 'framer-motion';
import { Trophy, Crown, ListOrdered } from 'lucide-react';
import MvpBadge from '@/components/MvpBadge';
import { useMvpCounts } from '@/lib/useMvpCounts';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

/* ═══════════════════════════════════════════════════════════════════
   STADIUM VIP — Tier configuration
   #1 = gold foil + shimmer + crown · #2 = silver · #3 = bronze
   ═══════════════════════════════════════════════════════════════════ */
const TIERS = {
  1: {
    label: 'אלוף',
    cardWidth: 'w-[118px] sm:w-[180px]',
    pedHeight: 'h-56 sm:h-72',                                // mobile 224 / desktop 288
    pedClass: 'st-foil',                                       // st-sweep would override position:absolute — use st-foil-shine via overlay
    pedRing: 'ring-1 ring-amber-300/55',
    pedNumColor: 'text-stadium',
    pedNumSize: 'text-[3.5rem] sm:text-[5rem]',                // mobile 56 / desktop 80
    avatarSize: 'w-[72px] h-[72px] sm:w-28 sm:h-28',           // mobile 72 / desktop 112
    avatarText: 'text-2xl sm:text-3xl',
    avatarRing: 'ring-amber-300',
    avatarGlow: 'shadow-[0_10px_30px_-8px_rgba(251,191,36,0.55)]',
    nameColor: 'text-amber-100',
    winTone: 'text-amber-200',
    reflection: 'rgba(251,191,36,0.55)',
    // sculptural pedestal layers
    topLip: 'from-amber-100 to-transparent',
    bottomShade: 'from-amber-950/70 to-transparent',
    bevelShadow: 'inset 2px 0 0 rgba(254, 240, 138, 0.6), inset -2px 0 0 rgba(146, 64, 14, 0.5)',
    engrave: '0 1.5px 0 rgba(255, 220, 130, 0.5), 0 -1px 0 rgba(0, 0, 0, 0.4)',
    labelColor: 'text-amber-950/70',
    delay: 0.55,                                              // ceremony order: bronze → silver → GOLD last
    crown: true,
  },
  2: {
    label: 'סגן',
    cardWidth: 'w-[96px] sm:w-[140px]',
    pedHeight: 'h-36 sm:h-48',                                 // mobile 144 / desktop 192
    pedClass: 'bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700',
    pedRing: 'ring-1 ring-slate-300/45',
    pedNumColor: 'text-stadium',
    pedNumSize: 'text-[2.5rem] sm:text-[3.5rem]',              // mobile 40 / desktop 56
    avatarSize: 'w-[56px] h-[56px] sm:w-[84px] sm:h-[84px]',   // mobile 56 / desktop 84
    avatarText: 'text-lg sm:text-2xl',
    avatarRing: 'ring-slate-300',
    avatarGlow: 'shadow-[0_6px_22px_-8px_rgba(203,213,225,0.42)]',
    nameColor: 'text-slate-100',
    winTone: 'text-slate-200',
    reflection: 'rgba(203,213,225,0.4)',
    topLip: 'from-white to-transparent',
    bottomShade: 'from-slate-900/65 to-transparent',
    bevelShadow: 'inset 2px 0 0 rgba(241, 245, 249, 0.6), inset -2px 0 0 rgba(51, 65, 85, 0.5)',
    engrave: '0 1.5px 0 rgba(255, 255, 255, 0.55), 0 -1px 0 rgba(0, 0, 0, 0.4)',
    labelColor: 'text-slate-700/80',
    delay: 0.3,
    crown: false,
  },
  3: {
    label: 'ארד',
    cardWidth: 'w-[96px] sm:w-[140px]',
    pedHeight: 'h-28 sm:h-36',                                 // mobile 112 / desktop 144
    pedClass: 'bg-gradient-to-b from-orange-300 via-orange-600 to-orange-900',
    pedRing: 'ring-1 ring-orange-400/45',
    pedNumColor: 'text-orange-50',
    pedNumSize: 'text-[2.25rem] sm:text-[3.25rem]',            // mobile 36 / desktop 52
    avatarSize: 'w-[56px] h-[56px] sm:w-[84px] sm:h-[84px]',
    avatarText: 'text-lg sm:text-2xl',
    avatarRing: 'ring-orange-400',
    avatarGlow: 'shadow-[0_6px_22px_-8px_rgba(251,146,60,0.45)]',
    nameColor: 'text-orange-100',
    winTone: 'text-orange-200',
    reflection: 'rgba(251,146,60,0.45)',
    topLip: 'from-orange-200 to-transparent',
    bottomShade: 'from-orange-950/75 to-transparent',
    bevelShadow: 'inset 2px 0 0 rgba(254, 215, 170, 0.6), inset -2px 0 0 rgba(120, 53, 15, 0.55)',
    engrave: '0 1.5px 0 rgba(255, 200, 130, 0.5), 0 -1px 0 rgba(0, 0, 0, 0.55)',
    labelColor: 'text-orange-950/80',
    delay: 0.1,
    crown: false,
  },
};

/* ─── Count-up number — trophies tick from 0 to the real value ──── */
function CountUp({ value, delay = 0, duration = 0.8, className }) {
  const reduce = useReducedMotion();
  const [n, setN] = useState(reduce ? value : 0);
  useEffect(() => {
    if (reduce) { setN(value); return undefined; }
    const controls = animate(0, value, {
      delay, duration, ease: 'easeOut',
      onUpdate: (v) => setN(Math.round(v)),
    });
    return () => controls.stop();
  }, [value, delay, duration, reduce]);
  return <span className={className}>{n}</span>;
}

/* ─── One-shot gold confetti burst above the champion ──────────── */
const BURST_COLORS = ['#fbbf24', '#fde68a', '#f59e0b', '#ffffff', '#fcd34d'];

function GoldBurst({ delay = 0, count = 26 }) {
  const reduce = useReducedMotion();
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        angle: (i / count) * Math.PI * 2 + Math.random() * 0.4,
        dist: 60 + Math.random() * 80,
        size: 4 + Math.random() * 5,
        color: BURST_COLORS[i % BURST_COLORS.length],
        rot: Math.random() * 300 - 150,
        dur: 1.0 + Math.random() * 0.8,
        round: Math.random() > 0.5,
      })),
    [count],
  );
  if (reduce) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-8 z-30">
      {/* expanding flash ring — the "pop" that sells the burst */}
      <motion.span
        initial={{ x: '-50%', opacity: 0, scale: 0.2 }}
        animate={{ x: '-50%', opacity: [0, 0.9, 0], scale: [0.2, 1.9, 2.4] }}
        transition={{ delay, duration: 0.7, ease: 'easeOut' }}
        className="absolute w-16 h-16 rounded-full"
        style={{
          left: '50%',
          top: -8,
          border: '2px solid rgba(253,230,138,0.9)',
          boxShadow: '0 0 24px 6px rgba(251,191,36,0.5)',
        }}
      />
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ x: 0, y: 0, opacity: 0, rotate: 0 }}
          animate={{
            x: Math.cos(p.angle) * p.dist,
            y: Math.sin(p.angle) * p.dist * 0.85 + 46,   // outward, then a slight fall
            opacity: [0, 1, 1, 0],
            rotate: p.rot,
            scale: [1, 1, 0.6],
          }}
          transition={{ delay: delay + Math.random() * 0.12, duration: p.dur, ease: 'easeOut' }}
          className="absolute"
          style={{
            left: '50%',           // explicit anchor — abspos static position varies across browsers
            top: 0,
            width: p.size,
            height: p.size * (p.round ? 1 : 1.9),
            background: p.color,
            borderRadius: p.round ? '9999px' : '1px',
            boxShadow: '0 0 6px rgba(251,191,36,0.6)',
          }}
        />
      ))}
    </div>
  );
}

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
        <p className={`mt-2 sm:mt-2.5 font-black text-[0.72rem] sm:text-sm text-center leading-tight truncate max-w-full px-1 ${tier.nameColor}`}>
          {player.name}
        </p>
        <div className="mt-1 sm:mt-1.5 flex items-center gap-1 sm:gap-1.5">
          <Trophy className={`w-3 h-3 sm:w-4 sm:h-4 ${tier.winTone}`} strokeWidth={2.5} fill="currentColor" />
          <CountUp
            value={player.wins || 0}
            delay={tier.delay + 0.5}
            className={`tnum font-black text-sm sm:text-lg leading-none ${tier.winTone}`}
          />
        </div>
        {winRate != null && (
          <span className="mt-0.5 sm:mt-1 text-[0.55rem] sm:text-[0.65rem] font-black tnum text-ink-3 tracking-wide">
            {winRate}%
            <span className="opacity-60 mx-0.5 sm:mx-1">·</span>
            {player.appearances} משחקים
          </span>
        )}
      </div>
    </div>
  );
}

/* ─── Sculptural pedestal — beveled edges, engraved number, metal grain ── */
function Pedestal({ place, tier }) {
  const isOne = place === 1;
  return (
    <div className={`${tier.cardWidth} ${tier.pedHeight} relative -mt-0.5`}>
      {/* Pulsing breathing halo behind the pedestal — kept for #1 ambient glow */}
      {isOne && (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-8 rounded-3xl blur-3xl st-breathe"
          style={{ background: 'radial-gradient(60% 60% at 50% 50%, rgba(251,191,36,0.6), transparent 65%)' }}
        />
      )}

      {/* Main pedestal block */}
      <div
        className={`absolute inset-0 rounded-t-2xl ${tier.pedRing} ${tier.pedClass} overflow-hidden`}
        style={{
          boxShadow: isOne
            ? `${tier.bevelShadow}, 0 0 80px 4px rgba(251,191,36,0.5), 0 24px 48px -16px rgba(0,0,0,0.75)`
            : `${tier.bevelShadow}, 0 24px 48px -16px rgba(0,0,0,0.75)`,
        }}
      >
        {/* Top bright lip — 6px highlight at the top edge */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 top-0 h-1.5 bg-gradient-to-b ${tier.topLip} opacity-90`}
        />

        {/* Bottom dark base — anchors the pedestal to the floor */}
        <div
          aria-hidden
          className={`pointer-events-none absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t ${tier.bottomShade}`}
        />

        {/* Inner top-center radial sheen — overhead light catching the surface
            (slightly stronger on #1 for extra shine) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-2/3"
          style={{
            background: isOne
              ? 'radial-gradient(60% 80% at 50% 0%, rgba(255,255,255,0.55), transparent 70%)'
              : 'radial-gradient(60% 80% at 50% 0%, rgba(255,255,255,0.42), transparent 72%)',
          }}
        />

        {/* Vertical metal-brush grain — material richness */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30 mix-blend-overlay"
          style={{
            background:
              'repeating-linear-gradient(180deg, rgba(255,255,255,0.06) 0 1px, transparent 1px 4px)',
          }}
        />

        {/* GOLD SHIMMER SWEEP — only on #1, uses st-foil-shine (no position override) */}
        {isOne && (
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 st-foil-shine"
            style={{
              background:
                'linear-gradient(100deg, transparent 38%, hsl(46 92% 78% / 0.32) 50%, transparent 62%)',
            }}
          />
        )}

        {/* Tier label — only on #1 (the only pedestal with room) */}
        {isOne && (
          <div className="absolute inset-x-0 top-2.5 text-center pointer-events-none">
            <span className={`text-[0.6rem] font-black tracking-[0.42em] ${tier.labelColor}`}>
              {tier.label}
            </span>
          </div>
        )}

        {/* Engraved/embossed number — pressed-into-material effect */}
        <div
          className={`absolute inset-x-0 ${isOne ? 'top-7' : 'top-3'} text-center font-black ${tier.pedNumColor} ${tier.pedNumSize} leading-none`}
          style={{ textShadow: tier.engrave }}
        >
          {place}
        </div>

        {/* Hairline gold/silver/bronze divider near base */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-3 bottom-5 h-px opacity-30"
          style={{ background: tier.reflection }}
        />
      </div>

      {/* Soft floor reflection — tier-colored glow under the pedestal
          (#1 gets a stronger, wider reflection) */}
      <div
        aria-hidden
        className={`pointer-events-none absolute ${isOne ? '-bottom-4 inset-x-0 h-4' : '-bottom-3 inset-x-1.5 h-3'} rounded-full blur-md ${isOne ? 'opacity-80' : 'opacity-70'}`}
        style={{ background: tier.reflection }}
      />
    </div>
  );
}

/* ─── Full podium column — ceremony choreography ────────────────
   pedestal grows from the floor → card lands from above → crown
   bounces in → gold burst over the champion. Tapping the champion
   column replays the burst. */
function PodiumColumn({ player, place }) {
  const tier = TIERS[place];
  const isChampion = place === 1;
  const [burstKey, setBurstKey] = useState(0);
  return (
    <div
      className={`relative flex flex-col items-center ${isChampion ? 'z-10 cursor-pointer select-none' : ''}`}
      onClick={isChampion ? () => setBurstKey((k) => k + 1) : undefined}
    >
      {tier.crown && (
        <motion.div
          initial={{ y: -26, opacity: 0, scale: 0.6 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          transition={{ delay: tier.delay + 0.45, type: 'spring', damping: 12, stiffness: 260 }}
          className="mb-2 sm:mb-2.5 st-float drop-shadow-[0_0_18px_rgba(251,191,36,0.65)] sm:drop-shadow-[0_0_22px_rgba(251,191,36,0.7)]"
        >
          <Crown className="w-9 h-9 sm:w-14 sm:h-14 text-amber-300" strokeWidth={1.7} fill="currentColor" />
        </motion.div>
      )}
      <motion.div
        initial={{ opacity: 0, y: -28, scale: 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: tier.delay + 0.26, type: 'spring', damping: 16, stiffness: 220 }}
      >
        <TopCard player={player} tier={tier} />
      </motion.div>
      <motion.div
        initial={{ scaleY: 0, opacity: 0 }}
        animate={{ scaleY: 1, opacity: 1 }}
        transition={{ delay: tier.delay, type: 'spring', damping: 19, stiffness: 150 }}
        style={{ transformOrigin: 'bottom center' }}
      >
        <Pedestal place={place} tier={tier} />
      </motion.div>
      {isChampion && (
        <GoldBurst key={burstKey} delay={burstKey === 0 ? tier.delay + 0.75 : 0.05} />
      )}
    </div>
  );
}

/* ─── Stage light fixture — visible housing + glowing lens + tilted beam ── */
function StageLight({ side }) {
  const tilt = side === 'left' ? 28 : -28;
  const sideClass = side === 'left' ? 'left-1 sm:left-8' : 'right-1 sm:right-8';
  return (
    <div
      aria-hidden
      className={`absolute top-2 sm:top-3 ${sideClass} z-30 pointer-events-none`}
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '50% 0%' }}
    >
      <div className="relative flex flex-col items-center">
        {/* Suspension wire */}
        <div className="absolute -top-3 sm:-top-4 left-1/2 -translate-x-1/2 w-px h-3 sm:h-4 bg-slate-500/60" />

        {/* Housing (the fixture body) */}
        <div className="relative w-14 h-4 sm:w-20 sm:h-5 rounded-md bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 shadow-[0_6px_16px_rgba(0,0,0,0.6)] ring-1 ring-amber-700/30 z-20">
          <div className="absolute top-0.5 sm:top-1 inset-x-2 sm:inset-x-3 h-px bg-amber-200/40 rounded-full" />
        </div>

        {/* Lens (glowing bulb) */}
        <div
          className="-mt-1.5 sm:-mt-2 w-6 h-6 sm:w-8 sm:h-8 rounded-full z-10"
          style={{
            background:
              'radial-gradient(circle at 36% 30%, rgba(255,255,255,1) 0%, rgba(254,215,170,1) 24%, rgba(251,191,36,1) 58%, rgba(146,64,14,0.9) 100%)',
            boxShadow:
              '0 0 28px 6px rgba(251,191,36,0.85), 0 0 14px 2px rgba(255,237,179,1), inset -1.5px -1.5px 3px rgba(146,64,14,0.5)',
          }}
        />

        {/* Light beam — st-breathe gives it a slow live pulse */}
        <div
          className="-mt-2 sm:-mt-2.5 w-36 h-72 sm:w-52 sm:h-96 opacity-75 st-breathe"
          style={{
            background:
              'linear-gradient(to bottom, rgba(251,191,36,0.55) 0%, rgba(251,191,36,0.3) 35%, rgba(251,191,36,0.12) 70%, rgba(251,191,36,0) 100%)',
            clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(10px)',
          }}
        />
      </div>
    </div>
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
  const mvpCounts = useMvpCounts();
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
          <p className={`font-black text-sm truncate flex items-center gap-1.5 ${isTop3 ? 'text-white' : 'text-slate-200'}`}>
            <span className="truncate">{player.name}</span>
            <MvpBadge count={mvpCounts[player.id]} />
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

  // Ordering: wins desc → EFFICIENCY (win rate desc — same trophies with fewer
  // appearances ranks higher) → appearances desc (among 0%-rate players,
  // veterans stay above never-played) → name asc (Hebrew).
  const ranked = useMemo(() => {
    const rate = (p) => ((p.appearances || 0) > 0 ? (p.wins || 0) / p.appearances : 0);
    return [...players].sort((a, b) => {
      if ((b.wins || 0) !== (a.wins || 0)) return (b.wins || 0) - (a.wins || 0);
      if (rate(b) !== rate(a)) return rate(b) - rate(a);
      if ((b.appearances || 0) !== (a.appearances || 0)) return (b.appearances || 0) - (a.appearances || 0);
      return (a.name || '').localeCompare(b.name || '', 'he');
    });
  }, [players]);

  const totalWins = useMemo(() => ranked.reduce((s, p) => s + (p.wins || 0), 0), [ranked]);
  const [first, second, third] = ranked;

  return (
    <div className="pb-10 max-w-xl mx-auto">
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

                {/* Podium stage — relative wrapper so stage lights can be absolutely positioned */}
                <div className="relative">
                  {/* Two visible stage light fixtures shining gold onto #1 */}
                  <StageLight side="left" />
                  <StageLight side="right" />

                  {/* Podium columns — order in RTL flex: first child appears on RIGHT */}
                  <div className="flex items-end justify-center gap-2 sm:gap-3 min-h-[400px] sm:min-h-[540px]">
                    {second && <PodiumColumn player={second} place={2} />}
                    {first  && <PodiumColumn player={first}  place={1} />}
                    {third  && <PodiumColumn player={third}  place={3} />}
                  </div>
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
