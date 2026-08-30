import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { User, ArrowRight, Trophy, Target, Plus, Minus, X, Lock, Check, Crown, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { Round, Player, RoundBet } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { useRealtimeSync } from '@/lib/useRealtimeSync';
import { LuxCard, SectionTitle, EmptyState } from '@/components/ui/lux';

const TEAM = [
  { name: 'הצהובים', bar: 'bg-yellow-400', tint: 'bg-yellow-500/12 ring-yellow-500/30', text: 'text-yellow-300', hdr: 'from-yellow-500/25 to-yellow-600/5', dot: 'bg-yellow-400' },
  { name: 'הכחולים', bar: 'bg-blue-500',  tint: 'bg-blue-500/12 ring-blue-500/30',   text: 'text-blue-300',  hdr: 'from-blue-500/25 to-blue-600/5',   dot: 'bg-blue-400' },
  { name: 'הכתומים', bar: 'bg-orange-500', tint: 'bg-orange-500/12 ring-orange-500/30', text: 'text-orange-300', hdr: 'from-orange-500/25 to-orange-600/5', dot: 'bg-orange-400' },
];
const teamOf = (i) => TEAM[i % 3];

// Solid jersey colours for the line-up cards, matching the CreateRound preview
// (StepTeamsPreview) so the teams look the same in both screens.
const TEAM_SOLID = [
  { header: 'bg-yellow-500', card: 'bg-yellow-400', text: 'text-white' },
  { header: 'bg-blue-700',   card: 'bg-blue-600',   text: 'text-white' },
  { header: 'bg-orange-600', card: 'bg-orange-500', text: 'text-white' },
];


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
                    disabled={currentGoals === 0}
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
                    aria-label="הוסף גול"
                    className="grid place-items-center w-16 h-16 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-300 active:scale-95 transition-transform touch-manipulation"
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


// ─── Vote chart ───────────────────────────────────────────────────────────
// Driven by aggregate counts (voteSummary: [{voted_team_index, vote_count}]),
// not raw bet rows — so it scales flat with viewers. Voter names are not shown
// (privacy + egress); the tally is what matters for "who will win".
function VoteChart({ round, voteSummary, totalVotes, myVotedIndex }) {
  const countFor = (idx) => Number(voteSummary.find(v => v.voted_team_index === idx)?.vote_count || 0);
  return (
    <div className="space-y-3">
      {round.teams.map((_, idx) => {
        const t = teamOf(idx);
        const count = countFor(idx);
        const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
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
                {count} קולות · {pct}%
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
          </div>
        );
      })}
    </div>
  );
}

// ─── Betting section ──────────────────────────────────────────────────────
function BettingSection({ round, voteSummary, totalVotes, onVote, voting, hasVoted, myVotedIndex }) {
  return (
    <LuxCard accent="amber" glow>
      <div className="px-4 pt-3.5 pb-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Trophy className="w-4 h-4 text-amber-400" />
          <p className="st-gold-text font-black text-sm">ההימור שלכם להערב</p>
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
              {totalVotes === 0 && (
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
              <VoteChart round={round} voteSummary={voteSummary} totalVotes={totalVotes} myVotedIndex={myVotedIndex} />
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

  // Scorekeepers: trusted players who may edit LIVE SCORES (team wins + player
  // goals) but nothing else — they cannot close, publish or re-team a round.
  // The list lives in the `scorekeepers` table so it changes without a deploy;
  // this query is only for showing the controls. The real enforcement is
  // server-side (RLS + the enforce_scorekeeper_scope trigger), so a player who
  // forges this flag still cannot write.
  const { data: isScorekeeper = false } = useQuery({
    queryKey: ['is-scorekeeper', user?.email],
    queryFn: async () => {
      if (!supabase || !user?.email) return false;
      const { data, error } = await supabase.rpc('is_scorekeeper');
      if (error) { console.warn('[scorekeeper]', error.message); return false; }
      return !!data;
    },
    enabled: !!user?.email && !isAdmin,
    staleTime: 5 * 60_000,
  });

  // May edit the live score: admins, plus scorekeepers.
  const canEditScore = isAdmin || isScorekeeper;
  const queryClient = useQueryClient();
  const [voting, setVoting] = useState(false);
  const [localVotedIndex, setLocalVotedIndex] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(null);    // { player, teamIndex }
  const [savingGoals, setSavingGoals] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [closingRound, setClosingRound] = useState(false);
  // Latest-write-wins sequence numbers so rapid clicks don't race
  const winsSaveSeq = useRef(0);
  const goalsSaveSeq = useRef(0);

  const { data: currentPlayer } = useQuery({
    queryKey: ['my-player', user?.id, user?.email],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { data } = await supabase
        .from('players')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: round, isLoading } = useQuery({
    // Scorekeepers share the admin view: they must reach the round while it is
    // still unpublished, otherwise they cannot keep score during the game.
    queryKey: canEditScore ? ['latest-round-admin'] : ['latest-round'],
    queryFn: async () => {
      // Only the 5 most recent rounds — the active round is always among the
      // newest (it leaves the active filter once closed). Avoids re-fetching the
      // entire rounds history on every 60s poll, which would scale egress with
      // total rounds. GameHistory still fetches all (it needs the full history).
      const rounds = await Round.list('-created_date', 5);
      // Admin / scorekeeper: any active (uncompleted) round — no date/publish
      // filter, so scoring remains possible until the admin explicitly closes it.
      // Player: limited to last 3 days + published.
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3);
      cutoff.setHours(0, 0, 0, 0);
      return rounds.find(r =>
        Array.isArray(r.openingTeams) && r.openingTeams.length >= 2 &&
        r.winningTeam == null &&
        !r.victoryPhoto &&
        !r.is_closed &&
        (canEditScore || (new Date(r.date) >= cutoff && r.is_published === true))
      ) || null;
    },
    // No refetchInterval: the realtime subscription below pushes round changes
    // (goals, teams, publish/close) the moment they happen, which is strictly
    // faster than the old 60s poll and cheaper. Focus + staleTime stay as the
    // fallback for a dropped socket. See EGRESS.md.
    refetchOnWindowFocus: true,
    staleTime: 30000,
    placeholderData: (prev) => prev,
  });

  // LIVE SYNC: a goal or team edit entered on the phone shows on the desktop
  // (and every other viewer) within ~a second, in both directions.
  useRealtimeSync('rounds', [['latest-round'], ['rounds']]);

  // Force Supabase session refresh whenever the tab regains visibility,
  // so saves don't hang on an expired token after a long absence.
  useEffect(() => {
    if (!supabase) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
    enabled: !!round,
  });

  // Live vote tally via RPC: returns per-team COUNTS + which one is mine, not the
  // raw bet rows. This keeps egress flat (O(viewers)) no matter how many people
  // vote — pulling all rows for 100+ viewers every 30s was quadratic (~4 GB/mo).
  const { data: voteSummary = [] } = useQuery({
    queryKey: ['round-vote-summary', round?.id],
    queryFn: async () => {
      if (!round || !supabase) return [];
      const { data, error } = await supabase.rpc('round_vote_summary', { p_round_id: round.id });
      if (error) { console.warn('[vote summary]', error.message); return []; }
      return data || [];
    },
    enabled: !!round,
    refetchInterval: 30000,
  });

  const totalVotes = voteSummary.reduce((s, v) => s + Number(v.vote_count), 0);
  const myVotedFromDB = voteSummary.find(v => v.is_mine)?.voted_team_index;
  const myVotedIndex = myVotedFromDB ?? localVotedIndex;
  const hasVoted = myVotedIndex !== null && myVotedIndex !== undefined;

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
        queryClient.invalidateQueries({ queryKey: ['round-vote-summary', round.id] });
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
    if (!round) return;
    const qKey = canEditScore ? ['latest-round-admin'] : ['latest-round'];
    const roundId = round.id;
    const currentWins = round.teamWins || {};
    const nextWins = { ...currentWins, [teamIndex]: newCount };
    // Optimistic update — UI reflects the click instantly, regardless of network
    queryClient.setQueryData(qKey, { ...round, teamWins: nextWins });
    const mySeq = ++winsSaveSeq.current;
    try {
      await Round.update(roundId, { teamWins: nextWins });
      // Only re-sync from server if no newer click is in flight
      if (mySeq === winsSaveSeq.current) {
        queryClient.invalidateQueries({ queryKey: qKey });
        queryClient.invalidateQueries({ queryKey: ['rounds'] });
      }
    } catch (e) {
      if (mySeq === winsSaveSeq.current) {
        toast.error('שגיאה בשמירת הניצחון', { description: e?.message || 'נסה שוב' });
      }
    }
  };

  // MVP voting moved out of MatchDay — it lives in the round-results flow
  // (the vote gate before seeing results), so no MVP UI/logic here.

  const handleCloseRound = async () => {
    if (!round) return;
    setClosingRound(true);
    try {
      // Award trophies on close. Closing a round used to ONLY set is_closed, so a
      // round finished from here had its winner & trophies never recorded (wins
      // weren't bumped, winningTeam stayed null). Now: if a result exists and no
      // winner is recorded yet, derive the winner from teamWins and bump each
      // winning player's `wins`. Guarded by winningTeam == null so re-closing or a
      // round already finalized in StepResults can't double-award.
      let winnerUpdate = {};
      try {
        const tw = round.teamWins || {};
        const hasResult = Object.values(tw).some((v) => (v || 0) > 0);
        if (hasResult && round.winningTeam == null && Array.isArray(round.teams)) {
          let maxWins = -1, winningTeamIndex = -1, tie = false;
          round.teams.forEach((_, i) => {
            const w = tw[i] || 0;
            if (w > maxWins) { maxWins = w; winningTeamIndex = i; tie = false; }
            else if (w === maxWins) { tie = true; }
          });
          if (!tie && winningTeamIndex >= 0 && maxWins > 0) {
            winnerUpdate = { winningTeam: winningTeamIndex };
            // +1 win for each player on the winning team (best-effort, parallel).
            const winners = round.teams[winningTeamIndex] || [];
            await Promise.all(
              winners.map((pid) => {
                const p = allPlayers.find((x) => x.id === pid);
                return p ? Player.update(pid, { wins: (p.wins || 0) + 1 }) : null;
              })
            );
            queryClient.invalidateQueries({ queryKey: ['players'] });
          }
        }
      } catch (awardErr) {
        // Don't block closing if trophy distribution hiccups — surface it though.
        console.warn('[CloseRound] trophy award failed', awardErr);
        toast.warning('המחזור ייסגר, אך חלוקת הגביעים נכשלה — בדוק ידנית');
      }

      // Finalize the round: it should vanish from the home screen / active views
      // and live only in game history. is_closed is the flag every active-round
      // filter checks; is_published:false keeps it out of player-facing views too.
      // If the is_closed column hasn't been migrated yet, fall back to is_published
      // alone so closing still succeeds instead of 400ing on the whole update.
      // closed_at stamps the moment of closing — the MVP voting window is 48h
      // from here (see mvp_voting_open / cast_mvp_vote).
      const closedAt = new Date().toISOString();
      try {
        await Round.update(round.id, { is_closed: true, is_published: false, closed_at: closedAt, ...winnerUpdate });
      } catch (err) {
        const msg = String(err?.message || '');
        const missingCol = err?.code === '42703' || /is_closed/.test(msg) || /closed_at/.test(msg) || /column/.test(msg);
        if (!missingCol) throw err;
        console.warn('[CloseRound] is_closed/closed_at column missing — closing via is_published only', msg);
        await Round.update(round.id, { is_published: false, ...winnerUpdate });
      }
      queryClient.invalidateQueries({ queryKey: ['latest-round'] });
      queryClient.invalidateQueries({ queryKey: ['latest-round-admin'] });
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
      toast.success('המחזור נסגר בהצלחה');
      // Keep the admin in the admin area after closing — only players go to PlayerHome.
      navigate(isAdmin ? '/Home' : '/PlayerHome');
    } catch (e) {
      toast.error('שגיאה בסגירת המחזור', { description: e.message });
      setClosingRound(false);
      setConfirmClose(false);
    }
  };

  const handleGoalChange = async (newCount) => {
    if (!editingPlayer || !round) return;
    const qKey = canEditScore ? ['latest-round-admin'] : ['latest-round'];
    const roundId = round.id;
    const pid = editingPlayer.player.id;
    const nextGoals = { ...(round.player_goals || {}), [pid]: newCount };
    queryClient.setQueryData(qKey, { ...round, player_goals: nextGoals });
    const mySeq = ++goalsSaveSeq.current;
    setSavingGoals(true);
    try {
      await Round.update(roundId, { player_goals: nextGoals });
      if (mySeq === goalsSaveSeq.current) {
        queryClient.invalidateQueries({ queryKey: qKey });
        queryClient.invalidateQueries({ queryKey: ['rounds'] });
      }
    } catch (e) {
      if (mySeq === goalsSaveSeq.current) {
        toast.error('שגיאה בשמירת הגול', { description: e?.message || 'נסה שוב' });
      }
    } finally {
      if (mySeq === goalsSaveSeq.current) setSavingGoals(false);
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

  // Leading team (unique max wins > 0) gets a crown on its lineup header.
  const winsByTeam = round.teams.map((_, i) => round.teamWins?.[i] ?? 0);
  const maxTeamWins = Math.max(...winsByTeam);
  const leadingTeam =
    maxTeamWins > 0 && winsByTeam.filter((w) => w === maxTeamWins).length === 1
      ? winsByTeam.indexOf(maxTeamWins)
      : -1;

  return (
    <div className="pb-28" dir="rtl">
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
          <div className="flex items-center gap-2 shrink-0">
            {isAdmin && (
              confirmClose ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-300 text-[0.7rem] font-black">בטוח?</span>
                  <button
                    type="button"
                    onClick={handleCloseRound}
                    disabled={closingRound}
                    className="grid place-items-center w-8 h-8 rounded-lg bg-rose-500/25 text-rose-300 ring-1 ring-rose-500/40 active:scale-95 disabled:opacity-50 transition-transform touch-manipulation"
                    aria-label="אישור סגירת מחזור"
                  >
                    <Check className="w-4 h-4" strokeWidth={3} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClose(false)}
                    disabled={closingRound}
                    className="grid place-items-center w-8 h-8 rounded-lg bg-slate-700/80 text-slate-300 ring-1 ring-white/10 active:scale-95 transition-transform touch-manipulation"
                    aria-label="ביטול"
                  >
                    <X className="w-4 h-4" strokeWidth={2.5} />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClose(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30 text-rose-300 text-[0.7rem] font-black active:scale-95 transition-transform touch-manipulation"
                >
                  <Lock className="w-3 h-3" strokeWidth={2.5} />
                  סגור מחזור
                </button>
              )
            )}
            <button
              onClick={() => navigate('/PlayerHome')}
              className="flex items-center gap-1 text-slate-400 active:text-white transition-colors text-sm font-bold"
            >
              <ArrowRight className="w-4 h-4" />
              חזרה
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Opening match */}
        {openingIdx.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <SectionTitle icon={Trophy} className="mb-3">משחק פותח</SectionTitle>
            <LuxCard accent="amber" clip glow>
              <div className="p-4">
                <div className="flex items-center gap-2.5">
                  {[openingIdx[0], openingIdx[1]].map((tIdx, side) => {
                    const t = teamOf(tIdx);
                    return (
                      <React.Fragment key={side}>
                        {side === 1 && (
                          <div className="relative grid place-items-center w-11 h-11 rounded-full st-foil ring-2 ring-slate-950 shadow-[0_6px_18px_-6px_rgba(212,160,40,0.7)] shrink-0">
                            <span className="font-black text-xs tracking-widest">VS</span>
                          </div>
                        )}
                        <div
                          className={`flex-1 min-w-0 py-4 px-2 rounded-xl ring-1 bg-gradient-to-b ${t.hdr} ${t.tint.split(' ')[1]} flex flex-col items-center gap-1.5`}
                        >
                          <span className={`w-2.5 h-2.5 rounded-full ${t.dot}`} />
                          <span className={`font-black text-lg leading-none truncate max-w-full ${t.text}`}>
                            {t.name}
                          </span>
                        </div>
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            </LuxCard>
          </motion.div>
        )}

        {/* Captains / referees — its own card above the line-ups, showing the
            three names at full size with their photos. The team headers below
            also name their captain, but that is a small line inside a narrow
            column; this is the at-a-glance "who referees tonight" answer.
            Hidden for rounds saved before captains existed (captains == null). */}
        {Array.isArray(round.captains) && round.captains.some(Boolean) && (
          <div className="mb-5">
            <SectionTitle icon={Award} className="mb-3">שופטי הערב</SectionTitle>
            <LuxCard accent="amber" glow>
              <div className={`grid gap-2 p-2.5 ${round.captains.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                {round.captains.map((pid, teamIdx) => {
                  const t = teamOf(teamIdx);
                  const p = pid ? allPlayers.find(x => x.id === pid) : null;
                  if (!p) return <div key={`cap-${teamIdx}`} />;
                  return (
                    <div
                      key={`cap-${teamIdx}`}
                      className={`flex flex-col items-center gap-1.5 rounded-xl px-1.5 py-2.5 bg-gradient-to-b ${t.hdr} ring-1 ${t.tint.split(' ')[1]}`}
                    >
                      <div className="relative shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} loading="lazy" className="w-11 h-11 sm:w-14 sm:h-14 rounded-full object-cover ring-2 ring-amber-300/80" />
                        ) : (
                          <div className="grid place-items-center w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-700 ring-2 ring-amber-300/80">
                            <User className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                        <span className="absolute -bottom-1 -right-1 text-sm sm:text-base leading-none drop-shadow">🎖️</span>
                      </div>
                      <p className={`font-black text-[0.72rem] sm:text-sm leading-tight text-center truncate max-w-full ${t.text}`}>
                        {p.name}
                      </p>
                      <span className={`text-[0.55rem] font-bold leading-none opacity-75 truncate max-w-full ${t.text}`}>
                        {t.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            </LuxCard>
          </div>
        )}

        {/* Teams — mirrors the CreateRound preview: solid team colours, the
            team's average rating in the header, its captain named beneath, and
            one coloured card per player. */}
        <div>
          <SectionTitle icon={User} className="mb-3">ההרכבים</SectionTitle>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`grid gap-1.5 sm:gap-3 items-start ${round.teams.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}
          >
            {round.teams.map((playerIds, teamIdx) => {
              const t = teamOf(teamIdx);
              const solid = TEAM_SOLID[teamIdx % 3];
              const isOpening = openingIdx.includes(teamIdx);
              const wins = round.teamWins?.[teamIdx] ?? 0;
              const capId = round.captains?.[teamIdx];
              const capName = capId ? allPlayers.find(x => x.id === capId)?.name : null;
              // Same fallback the preview uses, so a player with no rating
              // doesn't drag the average toward zero.
              const rated = playerIds.map(pid => allPlayers.find(x => x.id === pid)?.rating ?? 3);
              const avg = rated.length ? rated.reduce((s, r) => s + Number(r), 0) / rated.length : 0;

              return (
                <div key={`team-${teamIdx}`} className="min-w-0 space-y-1.5 sm:space-y-2">
                  {/* Header: name + average, captain, opener flag, wins */}
                  <div className={`${solid.header} rounded-xl sm:rounded-2xl px-1.5 py-2 sm:px-3 sm:py-2.5 shadow-lg`}>
                    <div className="flex items-center gap-1 justify-center min-w-0">
                      {teamIdx === leadingTeam && (
                        <Crown className={`w-3.5 h-3.5 shrink-0 ${solid.text}`} strokeWidth={2.6} />
                      )}
                      <p className={`font-black text-[0.78rem] sm:text-lg leading-tight truncate ${solid.text}`}>
                        {t.name} <span className="opacity-80 tnum">({avg.toFixed(1)})</span>
                      </p>
                    </div>
                    {capName && (
                      <p className={`text-[0.55rem] sm:text-xs font-black text-center leading-tight mt-0.5 truncate ${solid.text} opacity-90`}>
                        🎖️ {capName}
                      </p>
                    )}
                    <p className={`text-[0.5rem] font-bold text-center leading-none mt-0.5 ${isOpening ? 'text-emerald-900' : 'invisible'}`}>פותחת</p>
                    {canEditScore ? (
                      <div className="flex items-center justify-center gap-1 mt-1">
                        <button type="button" onClick={() => handleWinsChange(teamIdx, Math.max(0, wins - 1))} disabled={!wins} className="grid place-items-center w-6 h-6 rounded bg-black/25 text-white active:scale-95 disabled:opacity-30 transition-transform touch-manipulation">
                          <Minus className="w-2.5 h-2.5" strokeWidth={3} />
                        </button>
                        <span className={`font-black text-base tnum w-6 text-center leading-none ${solid.text}`}>{wins}</span>
                        <button type="button" onClick={() => handleWinsChange(teamIdx, wins + 1)} className="grid place-items-center w-6 h-6 rounded bg-black/25 text-white active:scale-95 transition-transform touch-manipulation">
                          <Plus className="w-2.5 h-2.5" strokeWidth={3} />
                        </button>
                      </div>
                    ) : (
                      <p className={`text-sm font-black tnum text-center leading-none mt-0.5 ${wins > 0 ? solid.text : 'invisible'}`}>{wins || 0}</p>
                    )}
                  </div>

                  {/* One card per player */}
                  {playerIds.map((pid) => {
                    const p = allPlayers.find(x => x.id === pid);
                    if (!p) return null;
                    const playerGoals = goals[pid] || 0;
                    const isCap = capId === pid;
                    const RowTag = canEditScore ? 'button' : 'div';
                    return (
                      <RowTag
                        key={`${teamIdx}-${pid}`}
                        type={canEditScore ? 'button' : undefined}
                        onClick={canEditScore ? () => setEditingPlayer({ player: p, teamIndex: teamIdx }) : undefined}
                        className={`w-full ${solid.card} rounded-xl sm:rounded-2xl p-1.5 sm:p-3 shadow-md flex items-center gap-1.5 sm:gap-2.5 ${isCap ? 'ring-2 ring-amber-200' : ''} ${canEditScore ? 'cursor-pointer active:scale-[0.99] transition-transform touch-manipulation' : ''}`}
                      >
                        {p.image ? (
                          <img src={p.image} alt={p.name} loading="lazy" className="w-7 h-7 sm:w-9 sm:h-9 rounded-full object-cover shrink-0 ring-2 ring-white/70" />
                        ) : (
                          <div className="grid place-items-center w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-white/30 ring-2 ring-white/70 shrink-0">
                            <span className={`text-[0.6rem] sm:text-xs font-black ${solid.text}`}>{p.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className={`flex-1 min-w-0 text-[0.7rem] sm:text-base font-bold truncate text-right ${solid.text}`}>
                          {p.name}
                        </span>
                        {playerGoals > 0 && (
                          <span className={`flex items-center gap-0.5 shrink-0 text-[0.62rem] font-black tnum ${solid.text}`}>
                            <Target className="w-3 h-3" strokeWidth={2.8} />
                            {playerGoals}
                          </span>
                        )}
                      </RowTag>
                    );
                  })}
                </div>
              );
            })}
          </motion.div>
        </div>

        {/* Betting */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="max-w-sm mx-auto w-full"
        >
          <BettingSection
            round={round}
            voteSummary={voteSummary}
            totalVotes={totalVotes}
            onVote={handleVote}
            voting={voting}
            hasVoted={hasVoted}
            myVotedIndex={myVotedIndex}
          />
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
