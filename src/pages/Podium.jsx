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
    label: 'אלוף',
    cardWidth: 'w-[270px]',
    pedHeight: 'h-[432px]',                  // 432px — towering
    pedClass: 'st-foil',                     // st-sweep would override position:absolute — use st-foil-shine via overlay
    pedRing: 'ring-1 ring-amber-300/55',
    pedNumColor: 'text-stadium',
    pedNumSize: 'text-[7.5rem]',             // 120px
    avatarSize: 'w-[168px] h-[168px]',       // 168px
    avatarText: 'text-5xl',
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
    delay: 0.05,
    crown: true,
  },
  2: {
    label: 'סגן',
    cardWidth: 'w-[210px]',
    pedHeight: 'h-72',                       // 288px
    pedClass: 'bg-gradient-to-b from-slate-200 via-slate-400 to-slate-700',
    pedRing: 'ring-1 ring-slate-300/45',
    pedNumColor: 'text-stadium',
    pedNumSize: 'text-[5.25rem]',            // 84px
    avatarSize: 'w-[126px] h-[126px]',       // 126px
    avatarText: 'text-4xl',
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
    delay: 0.18,
    crown: false,
  },
  3: {
    label: 'ארד',
    cardWidth: 'w-[210px]',
    pedHeight: 'h-[216px]',                  // 216px
    pedClass: 'bg-gradient-to-b from-orange-300 via-orange-600 to-orange-900',
    pedRing: 'ring-1 ring-orange-400/45',
    pedNumColor: 'text-orange-50',
    pedNumSize: 'text-[4.875rem]',           // 78px
    avatarSize: 'w-[126px] h-[126px]',
    avatarText: 'text-4xl',
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
        <p className={`mt-3.5 font-black text-xl text-center leading-tight truncate max-w-full px-1 ${tier.nameColor}`}>
          {player.name}
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <Trophy className={`w-6 h-6 ${tier.winTone}`} strokeWidth={2.4} fill="currentColor" />
          <span className={`tnum font-black text-2xl leading-none ${tier.winTone}`}>
            {player.wins || 0}
          </span>
        </div>
        {winRate != null && (
          <span className="mt-1.5 text-sm font-black tnum text-ink-3 tracking-wide">
            {winRate}%
            <span className="opacity-60 mx-1.5">·</span>
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
          initial={{ y: -14, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: tier.delay + 0.3, type: 'spring', stiffness: 240 }}
          className="mb-4 st-float drop-shadow-[0_0_32px_rgba(251,191,36,0.75)]"
        >
          <Crown className="w-[84px] h-[84px] text-amber-300" strokeWidth={1.6} fill="currentColor" />
        </motion.div>
      )}
      <TopCard player={player} tier={tier} />
      <Pedestal place={place} tier={tier} />
    </motion.div>
  );
}

/* ─── Stage light fixture — visible housing + glowing lens + tilted beam ── */
function StageLight({ side }) {
  const tilt = side === 'left' ? 28 : -28;
  const sideClass = side === 'left' ? 'left-2 sm:left-10' : 'right-2 sm:right-10';
  return (
    <div
      aria-hidden
      className={`absolute top-4 ${sideClass} z-30 pointer-events-none`}
      style={{ transform: `rotate(${tilt}deg)`, transformOrigin: '50% 0%' }}
    >
      <div className="relative flex flex-col items-center">
        {/* Suspension wire (small line going up — sells the 'mounted from ceiling' feel) */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-px h-6 bg-slate-500/60" />

        {/* Housing (the fixture body) */}
        <div className="relative w-32 h-8 rounded-lg bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.65)] ring-1 ring-amber-700/30 z-20">
          <div className="absolute top-1.5 inset-x-4 h-px bg-amber-200/45 rounded-full" />
        </div>

        {/* Lens (glowing bulb) — protrudes from bottom of housing */}
        <div
          className="-mt-3 w-12 h-12 rounded-full z-10"
          style={{
            background:
              'radial-gradient(circle at 36% 30%, rgba(255,255,255,1) 0%, rgba(254,215,170,1) 24%, rgba(251,191,36,1) 58%, rgba(146,64,14,0.9) 100%)',
            boxShadow:
              '0 0 54px 12px rgba(251,191,36,0.9), 0 0 24px 4px rgba(255,237,179,1), inset -3px -3px 6px rgba(146,64,14,0.55)',
          }}
        />

        {/* Light beam — trapezoidal cone extending from the lens downward */}
        <div
          className="-mt-4 w-[312px] h-[576px] opacity-75"
          style={{
            background:
              'linear-gradient(to bottom, rgba(251,191,36,0.55) 0%, rgba(251,191,36,0.3) 35%, rgba(251,191,36,0.12) 70%, rgba(251,191,36,0) 100%)',
            clipPath: 'polygon(40% 0%, 60% 0%, 100% 100%, 0% 100%)',
            filter: 'blur(16px)',
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
    <div className="pb-10 max-w-3xl mx-auto">
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
                  <div className="flex items-end justify-center gap-4 min-h-[810px]">
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
