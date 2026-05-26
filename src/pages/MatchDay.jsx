import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowRight, Trophy, Vote, Target, Plus, Minus, X, Swords, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { Round, Player, RoundBet } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { LuxCard, SectionTitle, EmptyState } from '@/components/ui/lux';

const TEAM = [
  { name: 'הצהובים', bar: 'bg-yellow-400', tint: 'bg-yellow-500/12 ring-yellow-500/30', text: 'text-yellow-300', hdr: 'from-yellow-500/25 to-yellow-600/5', dot: 'bg-yellow-400' },
  { name: 'הכחולים', bar: 'bg-blue-500',  tint: 'bg-blue-500/12 ring-blue-500/30',   text: 'text-blue-300',  hdr: 'from-blue-500/25 to-blue-600/5',   dot: 'bg-blue-400' },
  { name: 'הכתומים', bar: 'bg-orange-500', tint: 'bg-orange-500/12 ring-orange-500/30', text: 'text-orange-300', hdr: 'from-orange-500/25 to-orange-600/5', dot: 'bg-orange-400' },
];
const teamOf = (i) => TEAM[i % 3];

// ─── Compact team card ────────────────────────────────────────────────────
function TeamCard({ teamIndex, playerIds, allPlayers, isOpening, isAdmin, onTapPlayer }) {
  const t = teamOf(teamIndex);
  return (
    <div className={`rounded-2xl overflow-hidden flex flex-col bg-slate-900/70 ring-1 ${t.tint.split(' ')[1]}`}>
      <div className={`px-2 py-2.5 text-center bg-gradient-to-b ${t.hdr} min-h-[54px] flex flex-col items-center justify-center`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${t.dot}`} />
          <p className={`font-black text-sm leading-tight ${t.text}`}>{t.name}</p>
        </div>
        <span className={`text-[0.6rem] font-bold mt-0.5 ${isOpening ? 'text-emerald-300' : 'invisible'}`}>
          פותחת
        </span>
      </div>
      <div className="divide-y divide-white/5 flex-1">
        {playerIds.map(pid => {
          const p = allPlayers.find(x => x.id === pid);
          if (!p) return null;
          const RowTag = isAdmin ? 'button' : 'div';
          return (
            <RowTag
              key={pid}
              onClick={isAdmin ? () => onTapPlayer({ player: p, teamIndex }) : undefined}
              className={`w-full flex items-center gap-1.5 px-2 py-2 text-right ${
                isAdmin ? 'cursor-pointer hover:bg-white/8 active:bg-white/5 transition-colors touch-manipulation' : ''
              }`}
            >
              {p.image ? (
                <img src={p.image} alt={p.name} loading="lazy" className="w-5 h-5 sm:w-6 sm:h-6 rounded-full object-cover shrink-0 ring-1 ring-white/10" />
              ) : (
                <div className="grid place-items-center w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-700 shrink-0">
                  <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-slate-400" />
                </div>
              )}
              <p className="flex-1 text-white text-[0.65rem] sm:text-[0.72rem] font-bold truncate leading-tight">{p.name}</p>
            </RowTag>
          );
        })}
      </div>
    </div>
  );
}

// ─── Goal editor bottom-sheet (admin only) ────────────────────────────────
function GoalEditorSheet({ open, player, teamIndex, currentGoals, onClose, onChange, saving }) {
  if (typeof document === 'undefined') return null;
  const t = teamIndex != null ? teamOf(teamIndex) : null;

  return createPortal(
    <AnimatePresence>
      {open && player && (
        <motion.div
          dir="rtl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[1000] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 260 }}
            className="w-full sm:max-w-sm sm:w-[calc(100vw-32px)]"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="עריכת גולים"
          >
            <div className="relative rounded-t-3xl sm:rounded-3xl p-px bg-gradient-to-br from-amber-400/60 via-slate-700/30 to-slate-800/10">
              <div className="rounded-t-[23px] sm:rounded-[23px] bg-gradient-to-b from-slate-900 to-slate-950 p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {player.image ? (
                      <img src={player.image} alt={player.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-white/10 shrink-0" />
                    ) : (
                      <div className="grid place-items-center w-10 h-10 rounded-full bg-slate-700 shrink-0">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-black text-base truncate">{player.name}</p>
                      {t && (
                        <p className={`text-xs font-bold ${t.text}`}>{t.name}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    aria-label="סגור"
                    className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800/80 text-slate-400 active:scale-95 transition-transform touch-manipulation shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="st-rule my-4" />

                {/* Counter controls */}
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => onChange(Math.max(0, currentGoals - 1))}
                    disabled={saving || currentGoals === 0}
                    aria-label="הפחת גול"
                    className="grid place-items-center w-16 h-16 rounded-2xl bg-rose-500/15 ring-1 ring-rose-500/30 text-rose-300 active:scale-95 disabled:opacity-40 transition-transform touch-manipulation"
                  >
                    <Minus className="w-7 h-7" strokeWidth={3} />
                  </button>

                  <div className="flex-1 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Target className="w-5 h-5 text-amber-400" strokeWidth={2.4} />
                      <span className="text-amber-300 text-xs font-black tracking-wide">גולים</span>
                    </div>
                    <motion.p
                      key={currentGoals}
                      initial={{ scale: 0.7, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', damping: 18, stiffness: 320 }}
                      className="st-gold-text font-black text-6xl tnum leading-none mt-1"
                    >
                      {currentGoals}
                    </motion.p>
                  </div>

                  <button
                    onClick={() => onChange(currentGoals + 1)}
                    disabled={saving}
                    aria-label="הוסף גול"
                    className="grid place-items-center w-16 h-16 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-300 active:scale-95 disabled:opacity-50 transition-transform touch-manipulation"
                  >
                    <Plus className="w-7 h-7" strokeWidth={3} />
                  </button>
                </div>

                <p className="text-center text-ink-3 text-[0.65rem] font-bold mt-4">
                  {saving ? 'שומר...' : 'השינויים נשמרים אוטומטית'}
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

// ─── Live wins tracker (admin only) ──────────────────────────────────────
function WinsTracker({ teams, teamWins, onWinChange, saving }) {
  return (
    <LuxCard accent="emerald" glow>
      <div className="px-4 pt-3.5 pb-1 text-center">
        <div className="flex items-center justify-center gap-2">
          <Swords className="w-4 h-4 text-emerald-400" />
          <p className="text-white font-black text-sm">ניצחונות</p>
          <span className="text-[0.6rem] text-emerald-300/70 font-bold">(עדכון חי)</span>
        </div>
        <div className="st-rule mt-2.5" />
      </div>
      <div className="p-3 pt-2 grid gap-2" style={{ gridTemplateColumns: `repeat(${teams.length}, 1fr)` }}>
        {teams.map((_, idx) => {
          const t = teamOf(idx);
          const wins = teamWins?.[idx] ?? 0;
          return (
            <div key={idx} className="flex flex-col items-center gap-1.5">
              <div className="flex items-center gap-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${t.dot}`} />
                <span className={`text-[0.62rem] font-black ${t.text} truncate`}>{t.name}</span>
              </div>
              <motion.span
                key={wins}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 16, stiffness: 300 }}
                className="tnum font-black text-3xl text-white leading-none"
              >
                {wins}
              </motion.span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => onWinChange(idx, Math.max(0, wins - 1))}
                  disabled={saving || wins === 0}
                  aria-label={`הפחת ניצחון ${t.name}`}
                  className="grid place-items-center w-10 h-10 rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30 text-rose-300 hover:bg-rose-500/25 active:scale-95 disabled:opacity-40 transition-all cursor-pointer touch-manipulation"
                >
                  <Minus className="w-4 h-4" strokeWidth={3} />
                </button>
                <button
                  onClick={() => onWinChange(idx, wins + 1)}
                  disabled={saving}
                  aria-label={`הוסף ניצחון ${t.name}`}
                  className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-300 hover:bg-emerald-500/25 active:scale-95 disabled:opacity-50 transition-all cursor-pointer touch-manipulation"
                >
                  <Plus className="w-4 h-4" strokeWidth={3} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-center text-ink-3 text-[0.6rem] font-bold pb-3">
        {saving ? 'שומר...' : 'הניצחונות נשמרים אוטומטית'}
      </p>
    </LuxCard>
  );
}

// ─── Vote chart ───────────────────────────────────────────────────────────
function VoteChart({ round, bets, myVotedIndex, myPlayerId }) {
  const total = bets.length;
  return (
    <div className="space-y-3">
      {round.teams.map((_, idx) => {
        const t = teamOf(idx);
        const teamBets = bets.filter(b => b.voted_team_index === idx);
        const pct = total > 0 ? Math.round((teamBets.length / total) * 100) : 0;
        const isMyVote = idx === myVotedIndex;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black ${t.text}`}>{t.name}</span>
                {isMyVote && (
                  <span className="text-[0.55rem] st-foil px-1.5 py-0.5 rounded-full font-black">ההימור שלי</span>
                )}
              </div>
              <span className="text-ink-3 text-[0.62rem] font-bold tnum">
                {teamBets.length} קולות · {pct}%
              </span>
            </div>
            <div className="h-7 bg-slate-800/80 rounded-lg overflow-hidden ring-1 ring-white/5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: pct > 0 ? `${pct}%` : '4px' }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.12 }}
                className={`h-full ${t.bar} rounded-lg flex items-center justify-end px-2 min-w-[4px] ${isMyVote ? 'brightness-110' : ''}`}
              >
                {pct >= 20 && <span className="text-slate-900 font-black text-xs tnum">{pct}%</span>}
              </motion.div>
            </div>
            {teamBets.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 + idx * 0.1 }}
                className="flex flex-wrap gap-1"
              >
                {teamBets.map((b, i) => (
                  <span
                    key={i}
                    className={`text-[0.62rem] px-1.5 py-0.5 rounded-full font-bold ${
                      b.player_id === myPlayerId
                        ? 'bg-amber-400/20 text-amber-200'
                        : 'bg-slate-800/80 text-slate-400'
                    }`}
                  >
                    {b.player_name}
                  </span>
                ))}
              </motion.div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Betting section ──────────────────────────────────────────────────────
function BettingSection({ round, bets, onVote, voting, hasVoted, myVotedIndex, myPlayerId }) {
  return (
    <LuxCard accent="amber" glow>
      <div className="px-4 pt-3.5 pb-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <p className="st-gold-text font-black text-sm">מי תנצח הערב?</p>
        </div>
        <div className="st-rule mt-2.5" />
      </div>
      <div className="p-3 pt-1">
        <AnimatePresence mode="wait">
          {!hasVoted ? (
            <motion.div
              key="buttons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, transition: { duration: 0.1 } }}
              className="space-y-2"
            >
              <div className="grid grid-cols-3 gap-2">
                {round.teams.map((_, idx) => {
                  const t = teamOf(idx);
                  return (
                    <button
                      key={idx}
                      onClick={() => onVote(idx)}
                      disabled={voting}
                      className={`min-h-[56px] rounded-xl font-black text-xs text-white ring-1 ring-white/10 ${t.bar} active:scale-95 disabled:opacity-50 transition-transform`}
                    >
                      {t.name}
                    </button>
                  );
                })}
              </div>
              {bets.length === 0 && (
                <p className="text-ink-3 text-[0.62rem] text-center font-bold">היה הראשון להמר!</p>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="chart"
              initial={{ opacity: 0, scale: 0.94, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 22, stiffness: 220 }}
            >
              <VoteChart round={round} bets={bets} myVotedIndex={myVotedIndex} myPlayerId={myPlayerId} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LuxCard>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function MatchDay() {
  const { user, role, loginMode } = useAuth();
  const isAdmin = role === 'admin' && loginMode !== 'player';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [voting, setVoting] = useState(false);
  const [localVotedIndex, setLocalVotedIndex] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);    // { player, teamIndex }
  const [savingGoals, setSavingGoals] = useState(false);
  const [savingWins, setSavingWins] = useState(false);
  const [savingMvp, setSavingMvp] = useState(false);

  const { data: currentPlayer } = useQuery({
    queryKey: ['my-player', user?.id, user?.email],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { data } = await supabase
        .from('players')
        .select('*')
        .or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: round, isLoading } = useQuery({
    queryKey: isAdmin ? ['latest-round-admin'] : ['latest-round'],
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
        (isAdmin || r.is_published === true)
      ) || null;
    },
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    staleTime: 0,
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
    enabled: !!round,
  });

  const { data: bets = [] } = useQuery({
    queryKey: ['round-bets', round?.id],
    queryFn: async () => {
      if (!round) return [];
      try { return await RoundBet.filter({ round_id: round.id }); }
      catch { return []; }
    },
    enabled: !!round,
    refetchInterval: 15000,
  });

  const myBetFromDB = bets.find(b => b.player_id === currentPlayer?.id);
  const myVotedIndex = myBetFromDB?.voted_team_index ?? localVotedIndex;
  const hasVoted = myVotedIndex !== null && myVotedIndex !== undefined;

  const optimisticBets = hasVoted && !myBetFromDB && currentPlayer
    ? [...bets, { player_id: currentPlayer.id, player_name: currentPlayer.name, voted_team_index: localVotedIndex, round_id: round?.id }]
    : bets;

  const handleVote = async (teamIndex) => {
    if (!round || voting) return;
    setLocalVotedIndex(teamIndex);
    setVoting(true);
    try {
      if (currentPlayer) {
        await RoundBet.upsert(
          { round_id: round.id, player_id: currentPlayer.id, player_name: currentPlayer.name, voted_team_index: teamIndex },
          'round_id,player_id'
        );
        queryClient.invalidateQueries({ queryKey: ['round-bets', round.id] });
        toast.success(`הימרת על ${teamOf(teamIndex).name}!`);
      }
    } catch (e) {
      console.error('vote save failed', e);
      toast.error('ההימור הוצג אך לא נשמר בשרת');
    }
    setVoting(false);
  };

  const goals = round?.player_goals || {};

  const handleWinsChange = async (teamIndex, newCount) => {
    const cached = queryClient.getQueryData(['latest-round']);
    if (!cached) return;
    const nextWins = { ...(cached.teamWins || {}), [teamIndex]: newCount };
    queryClient.setQueryData(['latest-round'], { ...cached, teamWins: nextWins });
    setSavingWins(true);
    try {
      await Round.update(cached.id, { teamWins: nextWins });
      queryClient.invalidateQueries({ queryKey: ['latest-round'] });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    } catch (e) {
      toast.error('שגיאה בשמירת הניצחון', { description: e.message });
      queryClient.setQueryData(['latest-round'], cached);
    } finally {
      setSavingWins(false);
    }
  };

  const roundQueryKey = isAdmin ? ['latest-round-admin'] : ['latest-round'];

  const handleMvpChange = async (playerId) => {
    const cached = queryClient.getQueryData(roundQueryKey);
    if (!cached) return;
    const next = cached.starPlayer === playerId ? null : playerId;
    queryClient.setQueryData(roundQueryKey, { ...cached, starPlayer: next });
    setSavingMvp(true);
    try {
      await Round.update(cached.id, { starPlayer: next });
    } catch (e) {
      toast.error('שגיאה בשמירת השחקן המצטיין');
      queryClient.setQueryData(roundQueryKey, cached);
    } finally {
      setSavingMvp(false);
    }
  };

  const handleGoalChange = async (newCount) => {
    const cached = queryClient.getQueryData(['latest-round']);
    if (!cached || !editingPlayer) return;
    const pid = editingPlayer.player.id;
    const nextGoals = { ...(cached.player_goals || {}), [pid]: newCount };

    // Optimistic cache update — UI reflects the change immediately
    queryClient.setQueryData(['latest-round'], { ...cached, player_goals: nextGoals });
    setSavingGoals(true);
    try {
      await Round.update(cached.id, { player_goals: nextGoals });
      queryClient.invalidateQueries({ queryKey: ['latest-round'] });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
    } catch (e) {
      console.error('goal save failed', e);
      toast.error('שגיאה בשמירת הגול', { description: e.message });
      queryClient.setQueryData(['latest-round'], cached); // revert
    } finally {
      setSavingGoals(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] px-4" dir="rtl">
        <EmptyState
          icon={Trophy}
          title="אין מחזור פעיל"
          hint="ברגע שיפורסם מחזור חדש, סביבת המשחק תיפתח כאן."
          action={
            <button
              onClick={() => navigate('/PlayerHome')}
              className="flex items-center gap-1.5 text-amber-300 text-sm font-black"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה לאזור האישי
            </button>
          }
        />
      </div>
    );
  }

  const openingIdx = round.openingTeams || [];

  return (
    <div className="pb-10" dir="rtl">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-stadium/95 backdrop-blur-xl px-4 py-3.5">
        <div className="st-rule absolute bottom-0 inset-x-0" />
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="grid place-items-center w-11 h-11 rounded-xl border border-amber-500/30 bg-amber-500/15">
              <Trophy className="w-5 h-5 text-amber-300" strokeWidth={2.3} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[clamp(1.15rem,4.4vw,1.5rem)] font-black text-white tracking-tight leading-none">
                סביבת המשחק
              </h1>
              <p className="text-ink-3 text-xs font-bold mt-1">
                {format(new Date(round.date), 'd בMMMM yyyy', { locale: he })}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/PlayerHome')}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm font-bold shrink-0"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </button>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Opening match */}
        {openingIdx.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <SectionTitle icon={Trophy} className="mb-3">משחק פותח</SectionTitle>
            <LuxCard accent="amber">
              <div className="p-3.5">
                <div className="flex items-center gap-3">
                  <div className={`flex-1 py-3.5 rounded-xl ring-1 text-center ${teamOf(openingIdx[0]).tint}`}>
                    <span className={`font-black text-lg ${teamOf(openingIdx[0]).text}`}>
                      {teamOf(openingIdx[0]).name}
                    </span>
                  </div>
                  <span className="st-gold-text font-black text-base shrink-0">VS</span>
                  <div className={`flex-1 py-3.5 rounded-xl ring-1 text-center ${teamOf(openingIdx[1]).tint}`}>
                    <span className={`font-black text-lg ${teamOf(openingIdx[1]).text}`}>
                      {teamOf(openingIdx[1]).name}
                    </span>
                  </div>
                </div>
              </div>
            </LuxCard>
          </motion.div>
        )}

        {/* Live wins tracker — admin only */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <WinsTracker
              teams={round.teams}
              teamWins={round.teamWins}
              onWinChange={handleWinsChange}
              saving={savingWins}
            />
          </motion.div>
        )}

        {/* Teams */}
        <div>
          <SectionTitle icon={User} className="mb-3">ההרכבים</SectionTitle>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`grid gap-2 ${round.teams.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
          >
            {round.teams.map((playerIds, idx) => (
              <TeamCard
                key={idx}
                teamIndex={idx}
                playerIds={playerIds}
                allPlayers={allPlayers}
                isOpening={openingIdx.includes(idx)}
                isAdmin={isAdmin}
                onTapPlayer={setEditingPlayer}
              />
            ))}
          </motion.div>
        </div>

        {/* Betting */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
        >
          <SectionTitle icon={Vote} className="mb-3">ההימור של הערב</SectionTitle>
          <BettingSection
            round={round}
            bets={optimisticBets}
            onVote={handleVote}
            voting={voting}
            hasVoted={hasVoted}
            myVotedIndex={myVotedIndex}
            myPlayerId={currentPlayer?.id}
          />
        </motion.div>

        {/* MVP Picker */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <SectionTitle icon={Star} className="mb-3">השחקן המצטיין של הערב</SectionTitle>
          <div className="rounded-2xl bg-slate-900/70 ring-1 ring-white/8 p-4">
            {round.starPlayer ? (
              (() => {
                const mvp = allPlayers.find(p => p.id === round.starPlayer);
                return mvp ? (
                  <div className="flex items-center gap-3 mb-3 p-3 rounded-xl bg-amber-500/15 ring-1 ring-amber-400/40">
                    <div className="grid place-items-center w-10 h-10 rounded-xl st-foil text-base font-black shrink-0">
                      {(mvp.name?.[0] || '?').toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-amber-300 font-black text-sm">{mvp.name}</p>
                      <p className="text-amber-400/60 text-[0.65rem] font-bold">שחקן מצטיין ⭐</p>
                    </div>
                    {isAdmin && (
                      <button onClick={() => handleMvpChange(round.starPlayer)} className="text-slate-500 active:scale-95 transition-transform">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ) : null;
              })()
            ) : (
              <p className="text-slate-500 text-xs font-medium text-center mb-3">
                {isAdmin ? 'בחר שחקן מצטיין' : 'טרם נבחר שחקן מצטיין'}
              </p>
            )}
            {isAdmin && (
              <div className="grid grid-cols-2 gap-2">
                {round.teams.flatMap((playerIds, tIdx) =>
                  playerIds.map(pid => {
                    const p = allPlayers.find(pl => pl.id === pid);
                    if (!p) return null;
                    const t = teamOf(tIdx);
                    const selected = round.starPlayer === pid;
                    return (
                      <button
                        key={pid}
                        onClick={() => handleMvpChange(pid)}
                        disabled={savingMvp}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl ring-1 text-right transition-all active:scale-[0.98] touch-manipulation ${
                          selected
                            ? 'bg-amber-500/20 ring-amber-400/50'
                            : 'bg-slate-800/60 ring-white/8 hover:bg-slate-800'
                        }`}
                      >
                        <div className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${selected ? 'st-foil' : 'bg-slate-700'}`}>
                          <span className="text-xs font-black text-white">{(p.name?.[0] || '?').toUpperCase()}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-black truncate ${selected ? 'text-amber-300' : 'text-slate-300'}`}>{p.name}</p>
                          <p className={`text-[0.6rem] font-bold ${t.text} opacity-70`}>{t.name}</p>
                        </div>
                        {selected && <Star className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400" />}
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Goal editor (admin only) */}
      <GoalEditorSheet
        open={!!editingPlayer}
        player={editingPlayer?.player}
        teamIndex={editingPlayer?.teamIndex}
        currentGoals={goals[editingPlayer?.player?.id] || 0}
        onClose={() => setEditingPlayer(null)}
        onChange={handleGoalChange}
        saving={savingGoals}
      />
    </div>
  );
}
