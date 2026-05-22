import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Player, PlayerRating } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/lux';

const RATING_VALUES = [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
const toLabel = (r) => r % 1 === 0 ? `${r}` : `${r}`;

function RatingChips({ value, onChange }) {
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
      {RATING_VALUES.map(r => {
        const selected = value === r;
        return (
          <button
            key={r}
            onClick={() => onChange(r)}
            className={`shrink-0 min-w-[36px] h-9 px-1.5 rounded-xl font-bold text-sm touch-manipulation transition-colors ${
              selected
                ? 'bg-amber-500 text-slate-900 shadow shadow-amber-500/40'
                : 'bg-slate-700/80 text-slate-300 active:bg-slate-600'
            }`}
          >
            {toLabel(r)}
          </button>
        );
      })}
    </div>
  );
}

function PlayerRatingRow({ player, myRating, myPlayerId, onRate, savedId }) {
  const isSaved = savedId === player.id;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-b from-slate-800/80 to-slate-900/80 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4 shadow-lg shadow-black/20"
    >
      {/* Avatar */}
      <div className="shrink-0">
        {player.image ? (
          <img src={player.image} alt={player.name} className="w-11 h-11 rounded-xl object-cover ring-2 ring-amber-500/30" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center ring-2 ring-amber-500/30">
            <span className="text-base font-black text-amber-400/70">{player.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Name + Stars */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-base truncate mb-1.5">{player.name}</p>
        <RatingChips
          value={myRating}
          onChange={(rating) => onRate(player.id, rating)}
        />
      </div>

      {/* Saved indicator */}
      <AnimatePresence>
        {isSaved && (
          <motion.div
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="shrink-0 w-7 h-7 bg-emerald-500/20 rounded-full flex items-center justify-center"
          >
            <Check className="w-4 h-4 text-emerald-400" />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function RatePlayers() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState(null);

  // Fetch current player profile
  const { data: myPlayer } = useQuery({
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

  // Fetch all players
  const { data: allPlayers = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('name'),
  });

  // Fetch my existing ratings
  const { data: myRatings = [] } = useQuery({
    queryKey: ['my-ratings', myPlayer?.id],
    queryFn: () => myPlayer ? PlayerRating.filter({ rater_player_id: myPlayer.id }) : [],
    enabled: !!myPlayer?.id,
  });

  // Map rated_player_id → rating for O(1) lookup
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

  return (
    <div className="pb-28">
      <PageHeader icon={Star} title="דרג שחקנים" subtitle="דרג את חברי הסגל שלך" accent="amber" />

      <div className="p-4 mt-2">
        {loadingPlayers || !myPlayer ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-20 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5">
            {otherPlayers.map(player => (
              <PlayerRatingRow
                key={player.id}
                player={player}
                myRating={myRatingsMap[player.id] ?? 0}
                myPlayerId={myPlayer.id}
                onRate={handleRate}
                savedId={savedId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
