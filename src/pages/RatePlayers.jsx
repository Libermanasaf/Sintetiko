import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Player, PlayerRating } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check, ShieldQuestion, Users } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

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
            className={`shrink-0 min-w-[38px] h-10 px-1.5 rounded-xl font-black text-sm tnum transition-all duration-100 active:scale-90 ${
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

function PlayerRatingRow({ player, myRating, onRate, savedId }) {
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
          <div className="flex items-center justify-between mb-1.5">
            <p className="font-black text-white text-base truncate">{player.name}</p>
            <AnimatePresence>
              {isSaved && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                  className="flex items-center gap-1 shrink-0 text-emerald-300 text-[0.68rem] font-black"
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  נשמר
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <RatingChips value={myRating} onChange={(rating) => onRate(player.id, rating)} />
        </div>
      </div>
    </motion.div>
  );
}

export default function RatePlayers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState(null);

  const { data: myPlayer, isLoading: loadingProfile } = useQuery({
    queryKey: ['my-player-profile', user?.id],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { data } = await supabase
        .from('players')
        .select('id')
        .or(`user_id.eq.${user.id},email.eq.${user.email?.toLowerCase()}`)
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

  const myRatingsMap = Object.fromEntries(myRatings.map(r => [r.rated_player_id, r.rating]));

  const rateMutation = useMutation({
    mutationFn: ({ ratedPlayerId, rating }) =>
      PlayerRating.upsert(
        { rater_player_id: myPlayer.id, rated_player_id: ratedPlayerId, rating },
        'rater_player_id,rated_player_id'
      ),
    onSuccess: (_, { ratedPlayerId }) => {
      queryClient.invalidateQueries({ queryKey: ['my-ratings', myPlayer?.id] });
      setSavedId(ratedPlayerId);
      setTimeout(() => setSavedId(null), 1500);
    },
  });

  const handleRate = useCallback((ratedPlayerId, rating) => {
    if (!myPlayer?.id) return;
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
                  myRating={myRatingsMap[player.id] ?? 0}
                  onRate={handleRate}
                  savedId={savedId}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
