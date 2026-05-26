import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { motion, animate } from 'framer-motion';
import { Star, Trophy, Zap, Activity, TrendingUp, ShieldQuestion, Users, Lock, ChevronLeft, Flame, Bell } from 'lucide-react';
import { Player, PlayerRating, Round } from '@/api/entities';
import { SectionTitle, EmptyState, Skeleton } from '@/components/ui/lux';
import InstallBanner from '@/components/InstallBanner';
import { pushSupported, subscribeToPush } from '@/lib/push';
import { toast } from 'sonner';

// ─── Count-up number animation ─────────────────────────────────────────────
function CountUp({ to, duration = 1.1, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVal(to);
      return;
    }
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: v => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, duration]);
  return <>{val}{suffix}</>;
}

// ─── Half-star: left half filled, right half empty ─────────────────────────
function HalfStarIcon({ size = 18, fillClass = 'fill-amber-500 text-amber-500', emptyClass = 'fill-transparent text-amber-700/40' }) {
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <Star style={{ width: size, height: size }} className={emptyClass} />
      <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
        <Star style={{ width: size, height: size }} className={fillClass} />
      </div>
    </div>
  );
}

// ─── Star rating ───────────────────────────────────────────────────────────
function StarRating({ rating }) {
  const r = rating || 3;
  return (
    <div className="flex gap-1 justify-center" aria-label={`דירוג ${r} מתוך 5`}>
      {[1, 2, 3, 4, 5].map(i => {
        const filled = r >= i;
        const half = !filled && r >= i - 0.5;
        if (half) return <HalfStarIcon key={i} size={20} />;
        return (
          <Star
            key={i}
            style={{ width: 20, height: 20 }}
            className={filled ? 'fill-amber-500 text-amber-500' : 'fill-transparent text-amber-700/40'}
          />
        );
      })}
    </div>
  );
}

// ─── FIFA-style stat tile ──────────────────────────────────────────────────
function StatTile({ icon: Icon, value, suffix, label, delay, iconClass, valueClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', damping: 18, stiffness: 220 }}
      className="relative rounded-2xl p-px bg-gradient-to-br from-amber-300/45 via-slate-700/25 to-slate-800/10"
    >
      <div className="rounded-[15px] bg-gradient-to-b from-slate-800/95 to-slate-950 px-2 py-3.5 flex flex-col items-center gap-1">
        <div className={`grid place-items-center w-9 h-9 rounded-full mb-0.5 ${iconClass}`}>
          <Icon className="w-[18px] h-[18px]" strokeWidth={2.3} />
        </div>
        <span className={`tnum text-2xl font-black leading-none ${valueClass}`}>
          <CountUp to={value} suffix={suffix || ''} />
        </span>
        <span className="text-[0.66rem] text-ink-3 font-bold tracking-wide">{label}</span>
      </div>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function PlayerHome() {
  const { user } = useAuth();
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );
  const [enablingNotif, setEnablingNotif] = useState(false);

  const handleEnableNotifications = async () => {
    setEnablingNotif(true);
    const ok = await subscribeToPush(user?.email);
    setEnablingNotif(false);
    if (ok) {
      setNotifPermission('granted');
      toast.success('התראות הופעלו!', { description: 'תקבל הודעה כשהרכבים מתפרסמים' });
    } else {
      toast.error('לא ניתן להפעיל התראות', {
        description: Notification.permission === 'denied'
          ? 'הרשאת ההתראות נחסמה. יש לאפשר ידנית בהגדרות הדפדפן.'
          : 'נסה שוב',
      });
      setNotifPermission(Notification.permission);
    }
  };

  const { data: player, isLoading } = useQuery({
    queryKey: ['my-player', user?.id, user?.email],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('-appearances'),
  });

  // Ratings I received — only count + average are shown to the player.
  // Rater identity is NEVER exposed in the UI.
  const { data: ratingsReceived = [] } = useQuery({
    queryKey: ['ratings-received', player?.id],
    queryFn: () => PlayerRating.filter({ rated_player_id: player.id }),
    enabled: !!player?.id,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Active round indicator — same key as MatchDay so cache is shared
  const { data: activeRound } = useQuery({
    queryKey: ['latest-round'],
    queryFn: async () => {
      const rounds = await Round.list('-created_date');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3);
      cutoff.setHours(0, 0, 0, 0);
      return rounds.find(r =>
        Array.isArray(r.openingTeams) && r.openingTeams.length >= 2 &&
        r.winningTeam == null &&
        !r.victoryPhoto &&
        new Date(r.date) >= cutoff &&
        r.is_published === true
      ) || null;
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchInterval: 30_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center px-6 pt-8 gap-7" dir="rtl">
        <Skeleton className="w-[min(280px,calc(100vw-48px))] aspect-[2/3] rounded-2xl" />
        <div className="w-full max-w-xs grid grid-cols-3 gap-2.5">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4" dir="rtl">
        <EmptyState
          icon={ShieldQuestion}
          title="האזור האישי שלך"
          hint="לא נמצא פרופיל שחקן המקושר לחשבון זה. פנה ליו״ר המועדון לקישור הכרטיס."
        />
      </div>
    );
  }

  const appearances = player.appearances || 0;
  const wins = player.wins || 0;
  const winRate = appearances > 0 ? Math.round((wins / appearances) * 100) : 0;
  const rankIdx = allPlayers.findIndex(p => p.id === player.id);
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;

  const ratingsCount = ratingsReceived.length;
  const ratingsAvg = ratingsCount > 0
    ? ratingsReceived.reduce((sum, r) => sum + (Number(r.rating) || 0), 0) / ratingsCount
    : 0;

  return (
    <div className="flex flex-col items-center px-6 pt-6 pb-10 gap-6" dir="rtl">
      {/* ── Active round CTA — shown whenever there's an unfinished round ── */}
      {activeRound && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: 'spring', damping: 22, stiffness: 240 }}
          className="w-full max-w-xs"
        >
          <Link
            to="/MatchDay"
            className="block relative rounded-2xl p-px bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 active:scale-[0.98] transition-transform touch-manipulation"
            aria-label="מחזור פעיל — סביבת המשחק"
          >
            <div className="rounded-[15px] bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 px-4 py-3.5 flex items-center gap-3">
              {/* Live dot */}
              <div className="relative flex h-10 w-10 shrink-0">
                <span className="absolute inset-0 rounded-xl bg-emerald-500/30 animate-ping" aria-hidden="true" />
                <div className="relative grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/25 ring-1 ring-emerald-400/60">
                  <Flame className="w-5 h-5 text-amber-300" strokeWidth={2.4} />
                </div>
              </div>

              <div className="flex-1 min-w-0 text-right">
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 ring-1 ring-rose-400/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" aria-hidden="true" />
                    <span className="text-[0.55rem] text-rose-200 font-black tracking-wider">LIVE</span>
                  </span>
                  <p className="st-gold-text font-black text-sm">מחזור פעיל</p>
                </div>
                <p className="text-emerald-100/80 text-[0.7rem] font-bold leading-tight mt-0.5">
                  ההרכבים פורסמו — היכנס לסביבת המשחק
                </p>
              </div>

              <ChevronLeft className="w-5 h-5 text-amber-300 shrink-0" strokeWidth={2.6} />
            </div>
          </Link>
        </motion.div>
      )}

      {/* ── Install app banner ── */}
      <div className="w-full max-w-xs">
        <InstallBanner />
      </div>

      {/* ── Enable notifications — shown only when not yet granted ── */}
      {pushSupported() && notifPermission !== 'granted' && notifPermission !== 'denied' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-xs"
        >
          <button
            onClick={handleEnableNotifications}
            disabled={enablingNotif}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl bg-emerald-900/40 ring-1 ring-emerald-500/35 active:scale-[0.98] hover:bg-emerald-900/60 transition-all touch-manipulation disabled:opacity-60"
          >
            <div className="grid place-items-center w-9 h-9 rounded-xl bg-emerald-500/20 shrink-0">
              {enablingNotif
                ? <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                : <Bell className="w-4 h-4 text-emerald-400" />
              }
            </div>
            <div className="text-right flex-1 min-w-0">
              <p className="text-white font-black text-sm">הפעל התראות</p>
              <p className="text-emerald-300/70 text-[0.65rem] font-bold leading-tight">
                קבל הודעה כשהרכבים מתפרסמים
              </p>
            </div>
          </button>
        </motion.div>
      )}

      {/* ── Hero: FIFA gold card, floating ── */}
      <motion.div
        initial={{ opacity: 0, y: 36, scale: 0.84 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.3 }}
        className="relative w-full flex justify-center"
      >
        {/* stadium light behind the card */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-60 h-60 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 4.6, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 24px 56px rgba(200,150,25,0.5))' }}
        >
          <div
            className="relative"
            style={{
              width: 'min(280px, calc(100vw - 48px))',
              aspectRatio: '2 / 3',
              backgroundImage: 'url(/gold-card.png)',
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            }}
          >
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '18%' }}>
              {player.image ? (
                <img
                  src={player.image}
                  alt={player.name}
                  width={112}
                  height={112}
                  decoding="async"
                  className="rounded-full object-cover"
                  style={{
                    width: 'min(112px, 38vw)',
                    height: 'min(112px, 38vw)',
                    border: '3px solid rgba(200,155,30,0.85)',
                    boxShadow: '0 0 24px rgba(200,155,30,0.55), 0 4px 12px rgba(0,0,0,0.3)',
                  }}
                />
              ) : (
                <div
                  className="rounded-full flex items-center justify-center"
                  style={{
                    width: 'min(112px, 38vw)',
                    height: 'min(112px, 38vw)',
                    background: 'linear-gradient(135deg, rgba(212,175,55,0.35), rgba(180,130,20,0.2))',
                    border: '3px solid rgba(200,155,30,0.85)',
                    boxShadow: '0 0 24px rgba(200,155,30,0.55)',
                  }}
                >
                  <span className="text-4xl font-black" style={{ color: '#5a3500' }}>
                    {player.name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            <div className="absolute left-0 right-0 text-center px-4" style={{ top: '64%' }}>
              <h2
                className="font-black text-base leading-tight truncate"
                style={{ color: '#3d2000', letterSpacing: '0.01em' }}
              >
                {player.name}
              </h2>
            </div>

            <div className="absolute left-0 right-0 flex justify-center" style={{ top: '74%' }}>
              <StarRating rating={player.rating} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Stats panel ── */}
      <div className="w-full max-w-xs">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.32 }}
        >
          <SectionTitle icon={TrendingUp} className="mb-3">הביצועים שלי</SectionTitle>
        </motion.div>

        <div className="grid grid-cols-3 gap-2.5">
          <StatTile
            icon={Trophy} value={wins} label="ניצחונות" delay={0.38}
            iconClass="bg-amber-500/15 text-amber-300" valueClass="text-amber-300"
          />
          <StatTile
            icon={Activity} value={appearances} label="הופעות" delay={0.46}
            iconClass="bg-emerald-500/15 text-emerald-300" valueClass="text-white"
          />
          <StatTile
            icon={Zap} value={winRate} suffix="%" label="אחוז ניצחון" delay={0.54}
            iconClass="bg-sky-500/15 text-sky-300" valueClass="text-sky-300"
          />
        </div>

        {rank && appearances > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62 }}
            className="mt-3 flex items-center justify-center gap-1.5 text-xs font-bold text-ink-2"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" strokeWidth={2.6} />
            <span>מדורג <span className="text-amber-300 font-black tnum">#{rank}</span> בטבלת ההופעות</span>
          </motion.div>
        )}

        {/* ── Ratings received (anonymous) ── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, type: 'spring', damping: 22, stiffness: 220 }}
          className="mt-5"
        >
          {/* Eyebrow */}
          <div className="flex items-center gap-2 mb-2.5">
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/40" />
            <span className="text-[0.6rem] font-black tracking-[0.32em] text-amber-300/85 uppercase whitespace-nowrap">
              כך מדרגים אותך
            </span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/40" />
          </div>

          <div className="relative rounded-2xl p-px bg-gradient-to-br from-amber-300/55 via-slate-700/25 to-slate-800/10">
            <div className="rounded-[15px] bg-gradient-to-b from-slate-800/95 to-slate-950 px-4 py-4">
              {ratingsCount === 0 ? (
                <div className="flex flex-col items-center text-center py-1">
                  <div className="flex gap-0.5 mb-1.5 opacity-30">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className="w-4 h-4 fill-amber-500 text-amber-500" />
                    ))}
                  </div>
                  <p className="text-ink-2 text-xs font-bold">עדיין לא דירגו אותך</p>
                  <p className="text-ink-3 text-[0.62rem] font-bold mt-1 leading-relaxed max-w-[14rem]">
                    הציון הממוצע שלך יופיע כאן ברגע ששחקנים יתחילו לדרג
                  </p>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3">
                  {/* Average + stars */}
                  <div className="flex-1 text-center">
                    <div className="flex gap-0.5 justify-center mb-1.5" aria-label={`ממוצע ${ratingsAvg.toFixed(1)} מתוך 5`}>
                      {[1, 2, 3, 4, 5].map(i => {
                        const filled = ratingsAvg >= i;
                        const half = !filled && ratingsAvg >= i - 0.5;
                        if (half) return (
                          <HalfStarIcon
                            key={i}
                            size={16}
                            fillClass="fill-amber-400 text-amber-400"
                            emptyClass="fill-transparent text-amber-700/40"
                          />
                        );
                        return (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              filled ? 'fill-amber-400 text-amber-400' : 'fill-transparent text-amber-700/40'
                            }`}
                          />
                        );
                      })}
                    </div>
                    <span className="block tnum text-3xl font-black st-gold-text leading-none">
                      {ratingsAvg.toFixed(1)}
                    </span>
                    <span className="block text-[0.6rem] text-ink-3 font-bold mt-1 tracking-wide">
                      דירוג ממוצע
                    </span>
                  </div>

                  <div className="h-14 w-px bg-white/8" />

                  {/* Count */}
                  <div className="flex-1 text-center">
                    <div className="grid place-items-center w-7 h-7 mx-auto mb-1.5 rounded-full bg-emerald-500/15 ring-1 ring-emerald-500/30">
                      <Users className="w-3.5 h-3.5 text-emerald-300" strokeWidth={2.6} />
                    </div>
                    <span className="block tnum text-3xl font-black text-white leading-none">
                      <CountUp to={ratingsCount} />
                    </span>
                    <span className="block text-[0.6rem] text-ink-3 font-bold mt-1 tracking-wide">
                      {ratingsCount === 1 ? 'שחקן דירג' : 'שחקנים דירגו'}
                    </span>
                  </div>
                </div>
              )}

              {/* Privacy note */}
              <div className="mt-3 pt-2.5 border-t border-white/6 flex items-center justify-center gap-1.5">
                <Lock className="w-[11px] h-[11px] text-ink-3" strokeWidth={2.6} />
                <span className="text-[0.58rem] text-ink-3 font-bold tracking-wider">
                  זהות המדרגים אנונימית ולא חשופה
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
