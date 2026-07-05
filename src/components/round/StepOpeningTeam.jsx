import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Shuffle, Home, Dice5 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Round, Player } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים', 'הצהובים', 'הכחולים', 'הכתומים'];

// Per-team jersey identity: gradient fill + glow color + crest tint.
const TEAM_THEME = [
  { grad: 'from-amber-300 via-yellow-400 to-yellow-500', glow: 'rgba(250,204,21,0.55)', ring: 'ring-yellow-200/50', text: 'text-yellow-950' },
  { grad: 'from-blue-400 via-blue-500 to-blue-600',      glow: 'rgba(59,130,246,0.55)', ring: 'ring-blue-200/40',  text: 'text-white' },
  { grad: 'from-orange-400 via-orange-500 to-orange-600',glow: 'rgba(249,115,22,0.55)', ring: 'ring-orange-200/40',text: 'text-white' },
  { grad: 'from-amber-300 via-yellow-400 to-yellow-500', glow: 'rgba(250,204,21,0.55)', ring: 'ring-yellow-200/50', text: 'text-yellow-950' },
  { grad: 'from-blue-400 via-blue-500 to-blue-600',      glow: 'rgba(59,130,246,0.55)', ring: 'ring-blue-200/40',  text: 'text-white' },
  { grad: 'from-orange-400 via-orange-500 to-orange-600',glow: 'rgba(249,115,22,0.55)', ring: 'ring-orange-200/40',text: 'text-white' },
];

function TeamBanner({ index, side }) {
  const t = TEAM_THEME[index] ?? TEAM_THEME[0];
  return (
    <motion.div
      initial={{ y: side === 'top' ? -28 : 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: side === 'top' ? 0.18 : 0.28, type: 'spring', damping: 18, stiffness: 220 }}
      className="relative z-10"
    >
      <div
        className={`relative overflow-hidden rounded-xl px-4 py-3 bg-gradient-to-l ${t.grad} ring-1 ${t.ring}`}
        style={{ boxShadow: `0 8px 22px -10px ${t.glow}, inset 0 1px 0 rgba(255,255,255,0.35)` }}
      >
        {/* foil sheen */}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/10" aria-hidden />
        <div className={`relative flex items-center justify-center gap-2 ${t.text}`}>
          <span className="grid place-items-center w-7 h-7 rounded-full bg-black/15 backdrop-blur-sm shrink-0">
            <Trophy className="w-4 h-4" strokeWidth={2.4} />
          </span>
          <span className="text-lg sm:text-xl font-black tracking-tight" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.18)' }}>
            {TEAM_NAMES[index]}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function StepOpeningTeam({ numTeams, openingTeams, setOpeningTeams, teams, goalkeepers }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);

  const randomOpeningTeam = () => {
    const indices = [];
    while (indices.length < 2) {
      const randomIndex = Math.floor(Math.random() * numTeams);
      if (!indices.includes(randomIndex)) indices.push(randomIndex);
    }
    setOpeningTeams(indices);
  };

  const handleSaveAndGoHome = async () => {
    setSaving(true);
    try {
      const basePayload = {
        date: new Date().toISOString(),
        teams,
        goalkeepers,
        openingTeams,
        teamWins: {},
      };

      // Try saving WITH is_published; if that column doesn't exist yet in
      // Supabase the insert 400s — fall back to saving without it so the
      // round is still created and the user isn't stuck on "שומר...".
      try {
        await Round.create({ ...basePayload, is_published: false });
      } catch (err) {
        const msg = String(err?.message || '');
        const missingCol = err?.code === '42703' || /is_published/.test(msg) || /column/.test(msg);
        if (missingCol) {
          console.warn('[CreateRound] is_published column missing — saving without it', msg);
          await Round.create(basePayload);
        } else {
          throw err;
        }
      }

      // Bump each player's appearance count — never block navigation on this.
      try {
        const allPlayerIds = teams.flat();
        const allPlayers = await Player.list();
        const updates = allPlayerIds
          .map((pid) => {
            const p = allPlayers.find((x) => x.id === pid);
            return p ? Player.update(pid, { appearances: (p.appearances || 0) + 1 }) : null;
          })
          .filter(Boolean);
        await Promise.allSettled(updates);
      } catch (err) {
        console.error('שגיאה בעדכון הופעות שחקנים:', err);
      }

      // Refresh the home/round caches so the new round shows up immediately
      queryClient.invalidateQueries({ queryKey: ['latest-round-admin'] });
      queryClient.invalidateQueries({ queryKey: ['latest-round'] });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });

      toast.success('המחזור נשמר בהצלחה!');
      navigate('/');
    } catch (error) {
      console.error('שגיאה בשמירת המחזור:', error);
      toast.error('שגיאה בשמירת המחזור', { description: error?.message || 'נסה שוב' });
      setSaving(false); // re-enable the button so the user can retry
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="mx-auto w-full max-w-sm space-y-4"
    >
      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl px-4 py-3 text-center bg-gradient-to-l from-emerald-500/90 to-emerald-700/85 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-400/30"
      >
        <div className="flex items-center justify-center gap-2 text-white">
          <Shuffle className="w-4 h-4" />
          <span className="text-sm font-black">הכוחות אוזנו!</span>
        </div>
        <p className="text-white/85 text-[0.7rem] font-bold mt-0.5">הקבוצות מאוזנות ומוכנות למשחק</p>
      </motion.div>

      {/* Draw opening match button */}
      {!openingTeams && (
        <button
          onClick={randomOpeningTeam}
          className="w-full min-h-[56px] flex items-center justify-center gap-2.5 rounded-2xl st-foil text-base font-black shadow-[0_8px_24px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] transition-transform touch-manipulation"
        >
          <Trophy className="w-5 h-5" />
          הגרל משחק פותח
        </button>
      )}

      {/* Opening teams reveal */}
      <AnimatePresence>
        {openingTeams && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-4"
          >
            <div className="rounded-3xl p-3.5 bg-slate-900/70 ring-1 ring-amber-500/15 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.7)]">
              <div className="flex items-center justify-center gap-2 mb-3">
                <span className="h-px w-7 bg-gradient-to-l from-transparent to-amber-500/50" aria-hidden />
                <h2 className="text-center text-base font-black st-gold-text">הגרלת משחק פותח</h2>
                <span className="h-px w-7 bg-gradient-to-r from-transparent to-amber-500/50" aria-hidden />
              </div>

              {/* Football pitch — compact, near-square */}
              <div className="relative mx-auto aspect-square max-w-[300px] rounded-2xl p-4 flex flex-col justify-between overflow-hidden ring-1 ring-emerald-300/20 shadow-[inset_0_2px_18px_rgba(0,0,0,0.4)]">
                {/* Grass base + mowing stripes */}
                <div
                  className="absolute inset-0"
                  aria-hidden
                  style={{
                    background:
                      'repeating-linear-gradient(90deg, hsl(151 52% 36%) 0 14%, hsl(151 52% 41%) 14% 28%)',
                  }}
                />
                {/* Stadium light vignette */}
                <div
                  className="absolute inset-0"
                  aria-hidden
                  style={{
                    background:
                      'radial-gradient(120% 80% at 50% -10%, rgba(255,255,255,0.22), transparent 55%), radial-gradient(100% 70% at 50% 110%, rgba(0,0,0,0.35), transparent 60%)',
                  }}
                />
                {/* Pitch markings */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                  <div className="absolute inset-2.5 border-2 border-white/40 rounded-lg" />
                  <div className="absolute top-1/2 left-2.5 right-2.5 h-0.5 bg-white/40 -translate-y-1/2" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 border-2 border-white/40 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/60 rounded-full" />
                  <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-20 h-7 border-2 border-t-0 border-white/40 rounded-b-md" />
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-20 h-7 border-2 border-b-0 border-white/40 rounded-t-md" />
                </div>

                <TeamBanner index={openingTeams[0]} side="top" />

                {/* VS medallion */}
                <motion.div
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.42, type: 'spring', stiffness: 260, damping: 16 }}
                  className="relative z-10 mx-auto"
                >
                  <div className="grid place-items-center w-14 h-14 rounded-full bg-gradient-to-br from-rose-400 via-rose-500 to-pink-600 ring-4 ring-white shadow-[0_8px_20px_-6px_rgba(244,63,94,0.7)]">
                    <span className="text-white font-black text-xl italic" style={{ textShadow: '1px 2px 3px rgba(0,0,0,0.35)' }}>
                      VS
                    </span>
                  </div>
                </motion.div>

                <TeamBanner index={openingTeams[1]} side="bottom" />
              </div>

              {/* Reshuffle */}
              <button
                onClick={randomOpeningTeam}
                className="mt-3 w-full flex items-center justify-center gap-1.5 text-slate-400 text-sm font-bold hover:text-amber-300 active:text-amber-300 transition-colors touch-manipulation"
              >
                <Dice5 className="w-4 h-4" />
                הגרל מחדש
              </button>
            </div>

            {/* Save + go home */}
            <button
              onClick={handleSaveAndGoHome}
              disabled={saving}
              className="w-full min-h-[56px] flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-emerald-500 to-emerald-700 text-white text-base font-black shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-transform touch-manipulation"
            >
              {saving ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Home className="w-5 h-5" />
                  שמור וחזור למסך הבית
                </>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
