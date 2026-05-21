import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Player, PlayerRating } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Check } from 'lucide-react';

function StarPicker({ value, onChange }) {
  const [hover, setHover] = useState(null);
  const display = hover ?? value ?? 0;

  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(null)}>
      {[1, 2, 3, 4, 5].map(star => {
        const halfVal = Math.max(1.0, star - 0.5);
        const isFull = display >= star;
        const isHalf = !isFull && display >= star - 0.5 && display > 0;

        return (
          <div key={star} className="relative w-8 h-8 select-none">
            {/* Empty star */}
            <Star className="w-8 h-8 text-amber-400/25" />
            {/* Filled overlay */}
            {(isFull || isHalf) && (
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{ width: isFull ? '100%' : '50%' }}
              >
                <Star className="w-8 h-8 fill-amber-400 text-amber-400" />
              </div>
            )}
            {/* Left half zone → halfVal */}
            <div
              className="absolute inset-y-0 left-0 w-1/2 cursor-pointer"
              onMouseEnter={() => setHover(halfVal)}
              onClick={() => onChange(halfVal)}
            />
            {/* Right half zone → star */}
            <div
              className="absolute inset-y-0 right-0 w-1/2 cursor-pointer"
              onMouseEnter={() => setHover(star)}
              onClick={() => onChange(star)}
            />
          </div>
        );
      })}
      {value > 0 && (
        <span className="text-amber-400 font-bold text-sm self-center mr-1 w-6">
          {value % 1 === 0 ? value.toFixed(1) : value}
        </span>
      )}
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
      className="bg-slate-800/60 border border-slate-700/60 rounded-2xl p-4 flex items-center gap-4"
    >
      {/* Avatar */}
      <div className="shrink-0">
        {player.image ? (
          <img src={player.image} alt={player.name} className="w-11 h-11 rounded-xl object-cover border border-slate-600" />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center border border-slate-600">
            <span className="text-base font-black text-slate-400">{player.name.charAt(0)}</span>
          </div>
        )}
      </div>

      {/* Name + Stars */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-white text-base truncate mb-1.5">{player.name}</p>
        <StarPicker
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
      {/* Header */}
      <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-xl border border-amber-500/30">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-tight">דרג שחקנים</h1>
            <p className="text-slate-500 text-xs">דרג את חברי הסגל שלך</p>
          </div>
        </div>
      </div>

      <div className="p-4">
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
