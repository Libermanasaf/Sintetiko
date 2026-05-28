import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Shuffle, Home, Dice5 } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Round, Player } from '@/api/entities';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים', 'הצהובים', 'הכחולים', 'הכתומים'];

// Dark FIFA-luxury team gradients (match the rest of the app)
const TEAM_GRAD = [
  'bg-gradient-to-l from-yellow-400/90 to-yellow-600/80',
  'bg-gradient-to-l from-blue-500/90 to-blue-700/80',
  'bg-gradient-to-l from-orange-500/90 to-orange-700/80',
  'bg-gradient-to-l from-yellow-400/90 to-yellow-600/80',
  'bg-gradient-to-l from-blue-500/90 to-blue-700/80',
  'bg-gradient-to-l from-orange-500/90 to-orange-700/80',
];

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
      className="space-y-5"
    >
      {/* Success banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl p-5 text-center bg-gradient-to-l from-emerald-500/90 to-emerald-700/85 shadow-[0_10px_30px_-12px_rgba(16,185,129,0.6)] ring-1 ring-emerald-400/30"
      >
        <div className="flex items-center justify-center gap-2 text-white mb-1">
          <Shuffle className="w-5 h-5" />
          <span className="text-base font-black">הכוחות אוזנו!</span>
        </div>
        <p className="text-white/85 text-xs font-bold">הקבוצות מאוזנות ומוכנות למשחק</p>
      </motion.div>

      {/* Draw opening match button */}
      {!openingTeams && (
        <button
          onClick={randomOpeningTeam}
          className="w-full min-h-[60px] flex items-center justify-center gap-2.5 rounded-2xl st-foil text-lg font-black shadow-[0_8px_24px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] transition-transform touch-manipulation"
        >
          <Trophy className="w-6 h-6" />
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
            <div className="rounded-3xl p-4 sm:p-5 bg-slate-900/70 ring-1 ring-amber-500/15 shadow-[0_18px_44px_-22px_rgba(0,0,0,0.7)]">
              <h2 className="text-center text-xl sm:text-2xl font-black st-gold-text mb-4">
                הגרלת משחק פותח
              </h2>

              {/* Football field */}
              <div className="relative bg-gradient-to-b from-emerald-500/80 via-emerald-600/70 to-emerald-500/80 rounded-2xl p-5 sm:p-7 min-h-[300px] sm:min-h-[360px] flex flex-col justify-between shadow-inner overflow-hidden">
                {/* Field lines */}
                <div className="absolute inset-0 pointer-events-none" aria-hidden>
                  <div className="absolute inset-3 sm:inset-4 border-2 sm:border-4 border-white/35 rounded-xl" />
                  <div className="absolute top-1/2 left-3 right-3 sm:left-4 sm:right-4 h-0.5 sm:h-1 bg-white/35" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-20 sm:w-24 sm:h-24 border-2 sm:border-4 border-white/35 rounded-full" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-white/55 rounded-full" />
                  <div className="absolute top-3 sm:top-4 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-9 sm:h-12 border-2 sm:border-4 border-t-0 border-white/35 rounded-b-lg" />
                  <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 w-24 sm:w-32 h-9 sm:h-12 border-2 sm:border-4 border-b-0 border-white/35 rounded-t-lg" />
                </div>

                {/* Top team */}
                <motion.div
                  initial={{ y: -40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className={`relative z-10 ${TEAM_GRAD[openingTeams[0]]} rounded-2xl px-5 sm:px-8 py-4 sm:py-5 shadow-2xl text-white ring-1 ring-white/20`}
                >
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="grid place-items-center w-9 h-9 sm:w-11 sm:h-11 bg-white/20 rounded-full backdrop-blur-sm shrink-0">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-xl sm:text-3xl font-black">{TEAM_NAMES[openingTeams[0]]}</span>
                  </div>
                </motion.div>

                {/* VS */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                  className="relative z-10 mx-auto"
                >
                  <div className="grid place-items-center bg-gradient-to-br from-rose-400 via-rose-500 to-pink-500 rounded-full w-16 h-16 sm:w-20 sm:h-20 shadow-2xl border-4 border-white">
                    <span className="text-white font-black text-2xl sm:text-3xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
                      VS
                    </span>
                  </div>
                </motion.div>

                {/* Bottom team */}
                <motion.div
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className={`relative z-10 ${TEAM_GRAD[openingTeams[1]]} rounded-2xl px-5 sm:px-8 py-4 sm:py-5 shadow-2xl text-white ring-1 ring-white/20`}
                >
                  <div className="flex items-center justify-center gap-2.5">
                    <div className="grid place-items-center w-9 h-9 sm:w-11 sm:h-11 bg-white/20 rounded-full backdrop-blur-sm shrink-0">
                      <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <span className="text-xl sm:text-3xl font-black">{TEAM_NAMES[openingTeams[1]]}</span>
                  </div>
                </motion.div>
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
              className="w-full min-h-[60px] flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-l from-emerald-500 to-emerald-700 text-white text-lg font-black shadow-[0_8px_24px_-8px_rgba(16,185,129,0.6)] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-transform touch-manipulation"
            >
              {saving ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  שומר...
                </>
              ) : (
                <>
                  <Home className="w-6 h-6" />
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
