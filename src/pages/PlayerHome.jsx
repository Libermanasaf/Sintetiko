import React, { useState, useEffect } from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { motion, animate } from 'framer-motion';
import { Star, Trophy, Zap, Activity, ChevronLeft, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Round, Player } from '@/api/entities';

// ─── Count-up number animation ─────────────────────────────────────────────
function CountUp({ to, duration = 1.1, suffix = '' }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const controls = animate(0, to, {
      duration,
      ease: 'easeOut',
      onUpdate: v => setVal(Math.round(v)),
    });
    return () => controls.stop();
  }, [to, duration]);
  return <>{val}{suffix}</>;
}

// ─── Star rating ───────────────────────────────────────────────────────────
function StarRating({ rating }) {
  const r = rating || 3;
  return (
    <div className="flex gap-0.5 justify-center">
      {[1, 2, 3, 4, 5].map(i => {
        const filled = r >= i;
        const half = !filled && r >= i - 0.5;
        return (
          <Star
            key={i}
            className={`w-5 h-5 drop-shadow-sm ${
              filled ? 'fill-amber-500 text-amber-500'
              : half  ? 'fill-amber-500/50 text-amber-500'
                      : 'fill-transparent text-amber-700/40'
            }`}
          />
        );
      })}
    </div>
  );
}

// ─── FIFA-style stat tile ──────────────────────────────────────────────────
function StatTile({ icon: Icon, value, suffix, label, delay, iconClass }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', damping: 16, stiffness: 200 }}
      className="relative rounded-2xl p-px bg-gradient-to-br from-amber-300/60 via-amber-600/20 to-transparent"
    >
      <div className="rounded-2xl bg-gradient-to-b from-slate-800/95 to-slate-950 px-2 py-3.5 flex flex-col items-center gap-1">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center mb-0.5 ${iconClass}`}>
          <Icon className="w-4 h-4" />
        </div>
        <span className="text-2xl font-black text-white tabular-nums leading-none">
          <CountUp to={value} suffix={suffix || ''} />
        </span>
        <span className="text-[11px] text-slate-400 font-bold">{label}</span>
      </div>
    </motion.div>
  );
}

// ─── Active round card ─────────────────────────────────────────────────────
function ActiveRoundCard({ round }) {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.55, duration: 0.5, type: 'spring', bounce: 0.2 }}
      className="w-full max-w-xs"
    >
      <button
        onClick={() => navigate('/MatchDay')}
        className="group relative w-full rounded-2xl p-px bg-gradient-to-br from-emerald-400/60 via-emerald-700/20 to-transparent overflow-hidden touch-manipulation"
      >
        <div className="relative rounded-2xl bg-gradient-to-b from-slate-800/95 to-slate-950 px-4 py-3.5 flex items-center gap-3">
          {/* Glow */}
          <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* Live dot */}
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
          </span>

          <div className="flex-1 min-w-0 text-right">
            <p className="text-white font-black text-sm leading-tight">פורסמו הרכבים!</p>
            <p className="text-slate-400 text-xs">
              {format(new Date(round.date), "d בMMMM yyyy", { locale: he })}
            </p>
          </div>

          <ChevronLeft className="w-5 h-5 text-emerald-400 shrink-0 group-active:-translate-x-1 transition-transform" />
        </div>
      </button>
    </motion.div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────
export default function PlayerHome() {
  const { user } = useAuth();

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

  const { data: activeRound } = useQuery({
    queryKey: ['latest-round'],
    queryFn: async () => {
      const rounds = await Round.list('-created_date');
      return rounds.find(r =>
        Array.isArray(r.openingTeams) && r.openingTeams.length >= 2 &&
        r.winningTeam == null &&
        !r.victoryPhoto
      ) || null;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="w-10 h-10 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!player) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⚽</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">אזור אישי</h2>
        <p className="text-slate-500">לא נמצא פרופיל שחקן מקושר לחשבון זה.</p>
      </div>
    );
  }

  const appearances = player.appearances || 0;
  const wins = player.wins || 0;
  const winRate = appearances > 0 ? Math.round((wins / appearances) * 100) : 0;
  const rankIdx = allPlayers.findIndex(p => p.id === player.id);
  const rank = rankIdx >= 0 ? rankIdx + 1 : null;

  return (
    <div className="flex flex-col items-center px-6 py-8 pb-32 gap-7" dir="rtl">
      {/* ── Hero: gold card with float + glow ── */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
        className="w-full flex justify-center"
      >
        <motion.div
          animate={{ y: [0, -9, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ filter: 'drop-shadow(0 24px 64px rgba(200,150,25,0.55))' }}
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
            {/* Player photo */}
            <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '18%' }}>
              {player.image ? (
                <img
                  src={player.image}
                  alt={player.name}
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
                  <span
                    className="text-4xl font-black"
                    style={{ color: '#5a3500', textShadow: '0 1px 3px rgba(255,220,100,0.4)' }}
                  >
                    {player.name?.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Player name */}
            <div className="absolute left-0 right-0 text-center px-4" style={{ top: '64%' }}>
              <h2
                className="font-black text-base leading-tight truncate"
                style={{ color: '#3d2000', textShadow: '0 1px 3px rgba(255,230,120,0.5)', letterSpacing: '0.01em' }}
              >
                {player.name}
              </h2>
            </div>

            {/* Star rating */}
            <div className="absolute left-0 right-0 flex justify-center" style={{ top: '74%' }}>
              <StarRating rating={player.rating} />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Stats panel ── */}
      <div className="w-full max-w-xs">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2.5 mb-3"
        >
          <div className="h-px flex-1 bg-gradient-to-l from-amber-400/50 to-transparent" />
          <span className="text-amber-300/90 font-black text-xs tracking-widest uppercase">הביצועים שלי</span>
          <div className="h-px flex-1 bg-gradient-to-r from-amber-400/50 to-transparent" />
        </motion.div>

        {/* Tiles */}
        <div className="grid grid-cols-3 gap-2.5">
          <StatTile
            icon={Trophy}
            value={wins}
            label="גביעים"
            delay={0.38}
            iconClass="bg-amber-500/15 text-amber-400"
          />
          <StatTile
            icon={Activity}
            value={appearances}
            label="הופעות"
            delay={0.46}
            iconClass="bg-emerald-500/15 text-emerald-400"
          />
          <StatTile
            icon={Zap}
            value={winRate}
            suffix="%"
            label="ניצחון"
            delay={0.54}
            iconClass="bg-sky-500/15 text-sky-400"
          />
        </div>

        {/* Rank line */}
        {rank && appearances > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62 }}
            className="mt-2.5 flex items-center justify-center gap-1.5 text-xs text-slate-400"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>מדורג <span className="text-amber-300 font-black">#{rank}</span> בטבלת ההופעות</span>
          </motion.div>
        )}
      </div>

      {/* ── Active round ── */}
      {activeRound && <ActiveRoundCard round={activeRound} />}
    </div>
  );
}
