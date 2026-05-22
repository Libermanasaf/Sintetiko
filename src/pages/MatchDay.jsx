import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, User, Star, CheckCircle2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { Round, Player, RoundBet } from '@/api/entities';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { LuxCard, SectionTitle } from '@/components/ui/lux';

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים', 'הצהובים', 'הכחולים', 'הכתומים'];
const TEAM_BG    = ['bg-yellow-500', 'bg-blue-700', 'bg-orange-600', 'bg-yellow-500', 'bg-blue-700', 'bg-orange-600'];
const TEAM_LIGHT = ['bg-yellow-500/15 border-yellow-500/30', 'bg-blue-700/15 border-blue-600/30', 'bg-orange-600/15 border-orange-500/30', 'bg-yellow-500/15 border-yellow-500/30', 'bg-blue-700/15 border-blue-600/30', 'bg-orange-600/15 border-orange-500/30'];
const TEAM_TEXT  = ['text-yellow-400', 'text-blue-400', 'text-orange-400', 'text-yellow-400', 'text-blue-400', 'text-orange-400'];
const TEAM_HDR   = ['bg-yellow-500', 'bg-blue-700', 'bg-orange-600', 'bg-yellow-500', 'bg-blue-700', 'bg-orange-600'];

// ─── Small star row ───────────────────────────────────────────────────────
function MiniStars({ rating }) {
  const r = rating || 3;
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`w-2.5 h-2.5 ${r >= i ? 'fill-amber-400 text-amber-400' : r >= i - 0.5 ? 'fill-amber-400/50 text-amber-400' : 'text-white/20'}`}
        />
      ))}
    </div>
  );
}

// ─── Compact team card (for 3-col grid) ──────────────────────────────────
function TeamCard({ teamIndex, playerIds, allPlayers, isOpening }) {
  const name = TEAM_NAMES[teamIndex];

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg flex flex-col">
      {/* Header — fixed height so all 3 cards align */}
      <div className={`${TEAM_HDR[teamIndex % 3]} px-2 py-2.5 text-center flex flex-col items-center justify-center min-h-[52px]`}>
        <p className="text-white font-black text-sm leading-tight truncate">{name}</p>
        <span className={`text-[10px] font-semibold ${isOpening ? 'text-white/80' : 'invisible'}`}>⚽ פותחת</span>
      </div>

      {/* Players */}
      <div className="bg-slate-800/70 divide-y divide-slate-700/40 flex-1">
        {playerIds.map(pid => {
          const p = allPlayers.find(x => x.id === pid);
          if (!p) return null;
          return (
            <div key={pid} className="flex items-center gap-1.5 px-2 py-2">
              {p.image
                ? <img src={p.image} alt={p.name} className="w-6 h-6 rounded-full object-cover shrink-0" />
                : <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                    <User className="w-3 h-3 text-slate-400" />
                  </div>
              }
              <p className="text-white text-xs font-semibold truncate leading-tight">{p.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Vote chart ───────────────────────────────────────────────────────────
function VoteChart({ round, bets, myVotedIndex }) {
  const total = bets.length;
  return (
    <div className="space-y-3">
      {round.teams.map((_, idx) => {
        const teamBets = bets.filter(b => b.voted_team_index === idx);
        const pct = total > 0 ? Math.round((teamBets.length / total) * 100) : 0;
        const isMyVote = idx === myVotedIndex;
        return (
          <div key={idx} className="space-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-black ${TEAM_TEXT[idx % 3]}`}>{TEAM_NAMES[idx]}</span>
                {isMyVote && <span className="text-[9px] bg-white/15 text-white px-1.5 py-0.5 rounded-full font-bold">✓ שלי</span>}
              </div>
              <span className="text-slate-400 text-[10px]">{teamBets.length} קולות · {pct}%</span>
            </div>
            <div className="h-7 bg-slate-700/60 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: pct > 0 ? `${pct}%` : '4px' }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.12 }}
                className={`h-full ${TEAM_BG[idx % 3]} rounded-lg flex items-center justify-end px-2 min-w-[4px] ${isMyVote ? 'brightness-110' : ''}`}
              >
                {pct >= 20 && <span className="text-white font-black text-xs">{pct}%</span>}
              </motion.div>
            </div>
            {teamBets.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 + idx * 0.1 }} className="flex flex-wrap gap-1">
                {teamBets.map((b, i) => (
                  <span key={i} className={`text-[10px] px-1.5 py-0.5 rounded-full ${b.player_id === bets.find(x => x.voted_team_index === myVotedIndex && x.player_id === b.player_id)?.player_id ? 'bg-white/15 text-white font-bold' : 'bg-slate-700/60 text-slate-400'}`}>
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

// ─── Betting section — compact luxury card ────────────────────────────────
function BettingSection({ round, bets, onVote, voting, hasVoted, myVotedIndex }) {
  return (
    <div className="flex justify-center">
      <LuxCard accent="amber" className="w-full max-w-[320px]">
        {/* Title */}
        <div className="px-4 pt-3 pb-2.5 text-center">
          <p className="text-transparent bg-clip-text bg-gradient-to-l from-amber-300 via-amber-100 to-amber-300 font-black text-sm">
            🏆 מי תנצח את הערב?
          </p>
          <div className="mt-2 h-px bg-gradient-to-r from-transparent via-amber-400/40 to-transparent" />
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
                {/* Square team buttons */}
                <div className="grid grid-cols-3 gap-2">
                  {round.teams.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => onVote(idx)}
                      disabled={voting}
                      className={`${TEAM_BG[idx % 3]} text-white font-black text-xs py-4 rounded-xl active:scale-95 disabled:opacity-50 touch-manipulation flex items-center justify-center shadow-lg ring-1 ring-white/10 transition-transform`}
                    >
                      {TEAM_NAMES[idx]}
                    </button>
                  ))}
                </div>
                {bets.length === 0 && (
                  <p className="text-slate-500 text-[10px] text-center">היה הראשון להצביע!</p>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chart"
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20, stiffness: 200 }}
              >
                <VoteChart round={round} bets={bets} myVotedIndex={myVotedIndex} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </LuxCard>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────
export default function MatchDay() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [voting, setVoting] = useState(false);
  const [localVotedIndex, setLocalVotedIndex] = useState(null);

  // Current player profile
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

  // Latest active round
  const { data: round, isLoading } = useQuery({
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

  // All players
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
    enabled: !!round,
  });

  // Bets for this round
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

  // Derived voting state — optimistic first, then confirmed from DB
  const myBetFromDB = bets.find(b => b.player_id === currentPlayer?.id);
  const myVotedIndex = myBetFromDB?.voted_team_index ?? localVotedIndex;
  const hasVoted = myVotedIndex !== null && myVotedIndex !== undefined;

  // Optimistic bets: include the user's own bet immediately before DB confirms
  const optimisticBets = hasVoted && !myBetFromDB && currentPlayer
    ? [...bets, { player_id: currentPlayer.id, player_name: currentPlayer.name, voted_team_index: localVotedIndex, round_id: round?.id }]
    : bets;

  const handleVote = async (teamIndex) => {
    if (!round || voting) return;
    setLocalVotedIndex(teamIndex); // show chart immediately — never revert
    setVoting(true);
    try {
      if (currentPlayer) {
        await RoundBet.upsert(
          { round_id: round.id, player_id: currentPlayer.id, player_name: currentPlayer.name, voted_team_index: teamIndex },
          'round_id,player_id'
        );
        queryClient.invalidateQueries({ queryKey: ['round-bets', round.id] });
        toast.success(`הצבעת ל${TEAM_NAMES[teamIndex % 3]}!`);
      }
    } catch (e) {
      console.error('vote save failed', e);
      toast.error('ההצבעה הוצגה אך לא נשמרה בשרת');
    }
    setVoting(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
      </div>
    );
  }

  if (!round) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center" dir="rtl">
        <span className="text-5xl mb-4">⚽</span>
        <p className="text-slate-400 text-lg font-bold">אין מחזור פעיל כרגע</p>
        <button onClick={() => navigate('/PlayerHome')} className="mt-4 text-emerald-400 text-sm underline">
          חזרה לאזור האישי
        </button>
      </div>
    );
  }

  const openingIdx = round.openingTeams || [];

  return (
    <div className="pb-28" dir="rtl">
      {/* Sticky header */}
      <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-xl px-4 py-3">
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl border border-amber-500/30 bg-amber-500/15">
              <span className="text-base">⚽</span>
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">סביבת המשחק</h1>
              <p className="text-slate-500 text-xs">
                {format(new Date(round.date), "d בMMMM yyyy", { locale: he })}
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/PlayerHome')}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors text-sm touch-manipulation"
          >
            <ArrowRight className="w-4 h-4" />
            חזרה
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Opening match */}
        {openingIdx.length >= 2 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <LuxCard accent="amber">
              <div className="p-3">
                <SectionTitle className="mb-3">משחק פותח</SectionTitle>
                <div className="flex items-center gap-3">
                  <div className={`flex-1 py-3 rounded-xl ${TEAM_LIGHT[openingIdx[0] % 3]} border text-center`}>
                    <span className={`font-black text-lg ${TEAM_TEXT[openingIdx[0] % 3]}`}>
                      {TEAM_NAMES[openingIdx[0]]}
                    </span>
                  </div>
                  <span className="text-amber-400 font-black text-base shrink-0">VS</span>
                  <div className={`flex-1 py-3 rounded-xl ${TEAM_LIGHT[openingIdx[1] % 3]} border text-center`}>
                    <span className={`font-black text-lg ${TEAM_TEXT[openingIdx[1] % 3]}`}>
                      {TEAM_NAMES[openingIdx[1]]}
                    </span>
                  </div>
                </div>
              </div>
            </LuxCard>
          </motion.div>
        )}

        {/* Teams — 3 columns side by side */}
        <div>
          <SectionTitle className="mb-3">ההרכבים</SectionTitle>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-3 gap-2"
          >
            {round.teams.map((playerIds, idx) => (
              <TeamCard
                key={idx}
                teamIndex={idx}
                playerIds={playerIds}
                allPlayers={allPlayers}
                isOpening={openingIdx.includes(idx)}
              />
            ))}
          </motion.div>
        </div>

        {/* Betting */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <BettingSection
            round={round}
            bets={optimisticBets}
            onVote={handleVote}
            voting={voting}
            hasVoted={hasVoted}
            myVotedIndex={myVotedIndex}
          />
        </motion.div>
      </div>
    </div>
  );
}
