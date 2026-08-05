import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Player, PlayerRating } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, ShieldQuestion, Users, X, Loader2 } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';
import { toast } from 'sonner';

const RATING_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];

function RatingChips({ value, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5 st-no-scrollbar">
      {RATING_VALUES.map(r => {
        const selected = value === r;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            aria-label={`דרג ${r}`}
            aria-pressed={selected}
            className={`shrink-0 min-w-[44px] h-11 px-1.5 rounded-xl font-black text-sm tnum touch-manipulation transition-all duration-100 active:scale-90 ${
              selected
                ? 'st-foil shadow-[0_4px_12px_-4px_rgba(212,160,40,0.7)]'
                : 'bg-slate-800/90 text-slate-300 ring-1 ring-white/8 active:bg-slate-700'
            }`}
          >
            {r}
          </button>
        );
      })}
    </div>
  );
}

// ADMIN ONLY. Drill-down for one player: every rating they received, with the
// rater named. Backed by admin_player_rating_breakdown, which enforces
// is_admin() server-side — this component is never rendered for players, but
// the RPC is the actual boundary (the client check is only a UI convenience).
function RatingBreakdownModal({ player, onClose }) {
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ['admin-rating-breakdown', player.id],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error: rpcErr } = await supabase.rpc(
        'admin_player_rating_breakdown',
        { p_rated_player_id: player.id }
      );
      if (rpcErr) throw rpcErr;
      return data || [];
    },
    staleTime: 30_000,
  });

  const avg = rows.length
    ? (rows.reduce((s, r) => s + Number(r.rating), 0) / rows.length).toFixed(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md st-card p-5 max-h-[85dvh] overflow-y-auto overscroll-contain relative rounded-b-none sm:rounded-b-2xl"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button onClick={onClose} aria-label="סגור"
          className="absolute top-3 left-3 grid place-items-center w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 active:scale-95 z-10">
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-4 pl-10">
          {player.image ? (
            <img src={player.image} alt="" className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-500/30 shrink-0" />
          ) : (
            <div className="grid place-items-center w-12 h-12 rounded-xl bg-slate-700 ring-2 ring-amber-500/30 shrink-0">
              <span className="text-base font-black text-amber-400/70">{player.name.charAt(0)}</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="font-black text-white text-base truncate">{player.name}</p>
            <p className="text-ink-3 text-xs font-bold">
              {avg ? `ממוצע ${avg} מתוך ${rows.length} דירוגים` : 'מי דירג'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid place-items-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-amber-300" />
          </div>
        ) : error ? (
          <p className="text-center text-rose-300 text-sm font-bold py-8">
            טעינת הדירוגים נכשלה
          </p>
        ) : rows.length === 0 ? (
          <p className="text-center text-ink-3 text-sm font-bold py-8">
            אף אחד עוד לא דירג את {player.name}
          </p>
        ) : (
          <div className="space-y-1.5">
            {rows.map((r) => (
              <div key={r.rater_player_id}
                className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-800/50 ring-1 ring-white/8">
                {r.rater_image ? (
                  <img src={r.rater_image} alt="" className="w-8 h-8 rounded-lg object-cover ring-1 ring-white/10 shrink-0" />
                ) : (
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-slate-700 text-slate-300 font-black text-xs shrink-0">
                    {(r.rater_name?.[0] || '?').toUpperCase()}
                  </div>
                )}
                <span className="font-black text-white text-sm flex-1 truncate">{r.rater_name}</span>
                <span className="flex items-center gap-1 shrink-0 px-2 py-0.5 rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30">
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="font-black text-amber-300 text-xs tnum">{Number(r.rating).toFixed(1)}</span>
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

function PlayerRatingRow({ player, myRating, onRate, savedId, isAdmin, stats, onShowBreakdown }) {
  const isSaved = savedId === player.id;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative rounded-2xl p-px bg-gradient-to-br from-amber-300/30 via-slate-700/25 to-slate-800/10"
    >
      <div className="rounded-[15px] bg-gradient-to-b from-slate-800/95 to-slate-950 p-3.5 flex items-center gap-3.5">
        <div className="shrink-0">
          {player.image ? (
            <img
              src={player.image}
              alt={player.name}
              loading="lazy"
              className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-500/30"
            />
          ) : (
            <div className="grid place-items-center w-12 h-12 rounded-xl bg-slate-700 ring-2 ring-amber-500/30">
              <span className="text-base font-black text-amber-400/70">{player.name.charAt(0)}</span>
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5 gap-2">
            <p className="font-black text-white text-base truncate min-w-0">{player.name}</p>
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && stats && stats.count > 0 && (
                <button
                  onClick={() => onShowBreakdown(player)}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30 active:scale-95 hover:bg-amber-500/25 transition-all"
                  title={`ממוצע מתוך ${stats.count} דירוגים — לחץ לפירוט מי דירג`}
                >
                  <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                  <span className="font-black text-amber-300 text-xs tnum">{stats.avg}</span>
                  <span className="text-amber-400/60 text-[0.6rem] font-bold tnum">({stats.count})</span>
                </button>
              )}
              <AnimatePresence>
                {isSaved && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.6 }}
                    className="flex items-center gap-1 text-emerald-300 text-[0.68rem] font-black"
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    נשמר
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
          <RatingChips value={myRating} onChange={(rating) => onRate(player.id, rating)} />
        </div>
      </div>
    </motion.div>
  );
}

export default function RatePlayers() {
  const { user, role, loginMode } = useAuth();
  const isAdmin = role === 'admin' && loginMode !== 'player';
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState(null);
  const [breakdownPlayer, setBreakdownPlayer] = useState(null); // admin: whose ratings to detail
  // Optimistic local ratings — merged over server data for immediate UI feedback
  const [localRatings, setLocalRatings] = useState({});

  const { data: myPlayer, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-player-profile', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { data } = await supabase
        .from('players')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const { data: allPlayers = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('name'),
  });

  const { data: myRatings = [] } = useQuery({
    queryKey: ['my-ratings', myPlayer?.id],
    queryFn: () => myPlayer ? PlayerRating.filter({ rater_player_id: myPlayer.id }) : [],
    enabled: !!myPlayer?.id,
  });

  // Admin-only: per-player rating averages, computed in the DB via RPC so we
  // never pull the whole (unbounded) player_ratings table to the client. Returns
  // one row per rated player — egress is O(players), not O(ratings).
  const { data: ratingAverages = [] } = useQuery({
    queryKey: ['admin-rating-averages'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.rpc('admin_rating_averages');
      if (error) { console.warn('[rating averages]', error.message); return []; }
      return data || [];
    },
    enabled: isAdmin,
    staleTime: 30_000,
  });

  const ratingStatsByPlayer = useMemo(() => {
    if (!isAdmin) return {};
    const result = {};
    for (const r of ratingAverages) {
      result[r.rated_player_id] = { avg: Number(r.avg_rating).toFixed(1), count: Number(r.rating_count) };
    }
    return result;
  }, [ratingAverages, isAdmin]);

  const myRatingsMap = Object.fromEntries(myRatings.map(r => [r.rated_player_id, r.rating]));
  // Merge server ratings with optimistic local ones
  const displayRatings = { ...myRatingsMap, ...localRatings };

  const rateMutation = useMutation({
    mutationFn: ({ ratedPlayerId, rating }) =>
      PlayerRating.upsert(
        { rater_player_id: myPlayer.id, rated_player_id: ratedPlayerId, rating },
        'rater_player_id,rated_player_id'
      ),
    onSuccess: (_, { ratedPlayerId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-ratings', myPlayer?.id] });
      // Invalidate the rated player's received-ratings so PlayerHome updates on next visit
      queryClient.invalidateQueries({ queryKey: ['ratings-received', ratedPlayerId] });
      // Admin's all-player-ratings list also stale after a new rating
      queryClient.invalidateQueries({ queryKey: ['all-player-ratings'] });
      setSavedId(ratedPlayerId);
      setTimeout(() => setSavedId(null), 1800);
    },
    onError: (err, { ratedPlayerId }) => {
      // Revert optimistic update
      setLocalRatings(prev => {
        const next = { ...prev };
        delete next[ratedPlayerId];
        return next;
      });
      toast.error('שגיאה בשמירת הדירוג', { description: err?.message || 'נסה שוב' });
    },
  });

  const handleRate = useCallback((ratedPlayerId, rating) => {
    if (!myPlayer?.id) return;
    // Apply optimistic update immediately so chip highlights without waiting for server
    setLocalRatings(prev => ({ ...prev, [ratedPlayerId]: rating }));
    rateMutation.mutate({ ratedPlayerId, rating });
  }, [myPlayer?.id, rateMutation]);

  const otherPlayers = allPlayers.filter(p => p.id !== myPlayer?.id);
  const isLoading = loadingPlayers || loadingProfile;

  return (
    <div className="pb-10">
      <PageHeader icon={Star} title="דרג שחקנים" subtitle="הדירוג שלך מאזן את הקבוצות" accent="amber" />

      <div className="p-4">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-[88px] rounded-2xl" />)}
          </div>
        ) : !myPlayer ? (
          <EmptyState
            icon={ShieldQuestion}
            title="אין כרטיס שחקן"
            hint="רק שחקנים רשומים יכולים לדרג. פנה ליו״ר המועדון לקישור הכרטיס שלך."
          />
        ) : otherPlayers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="אין שחקנים לדרג"
            hint="כשיתווספו שחקנים נוספים לסגל, תוכל לדרג אותם כאן."
          />
        ) : (
          <>
            <div className="flex items-start gap-2.5 mb-4 rounded-xl bg-amber-500/8 ring-1 ring-amber-500/20 px-3.5 py-2.5">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400 mt-0.5 shrink-0" />
              <p className="text-amber-200/80 text-xs font-bold leading-relaxed">
                דרג כל שחקן מ־1 עד 5. הדירוג נשמר אוטומטית ומשמש לאיזון הקבוצות במחזורים.
              </p>
            </div>
            <div className="space-y-2.5">
              {otherPlayers.map(player => (
                <PlayerRatingRow
                  key={player.id}
                  player={player}
                  myRating={displayRatings[player.id] ?? 0}
                  onRate={handleRate}
                  savedId={savedId}
                  isAdmin={isAdmin}
                  stats={ratingStatsByPlayer[player.id]}
                  onShowBreakdown={setBreakdownPlayer}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {isAdmin && breakdownPlayer && (
          <RatingBreakdownModal
            player={breakdownPlayer}
            onClose={() => setBreakdownPlayer(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
