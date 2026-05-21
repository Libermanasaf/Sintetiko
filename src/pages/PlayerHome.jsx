import React from 'react';
import { useAuth } from '../lib/AuthContext';
import { supabase } from '../lib/supabase';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';

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
              filled
                ? 'fill-amber-500 text-amber-500'
                : half
                ? 'fill-amber-500/50 text-amber-500'
                : 'fill-transparent text-amber-700/40'
            }`}
          />
        );
      })}
    </div>
  );
}

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

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.8 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, type: 'spring', bounce: 0.35 }}
        style={{ filter: 'drop-shadow(0 24px 64px rgba(180,130,20,0.5))' }}
      >
        {/* Card */}
        <div
          className="relative"
          style={{
            width: 280,
            height: 420,
            backgroundImage: 'url(/gold-card.png)',
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
          }}
        >
          {/* Player photo */}
          <div
            className="absolute left-1/2 -translate-x-1/2"
            style={{ top: '18%' }}
          >
            {player.image ? (
              <img
                src={player.image}
                alt={player.name}
                className="w-28 h-28 rounded-full object-cover"
                style={{
                  border: '3px solid rgba(200,155,30,0.85)',
                  boxShadow: '0 0 24px rgba(200,155,30,0.55), 0 4px 12px rgba(0,0,0,0.3)',
                }}
              />
            ) : (
              <div
                className="w-28 h-28 rounded-full flex items-center justify-center"
                style={{
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
          <div
            className="absolute left-0 right-0 text-center px-5"
            style={{ top: '64%' }}
          >
            <h2
              className="font-black text-lg leading-tight truncate"
              style={{
                color: '#3d2000',
                textShadow: '0 1px 3px rgba(255,230,120,0.5)',
                letterSpacing: '0.01em',
              }}
            >
              {player.name}
            </h2>
          </div>

          {/* Star rating */}
          <div
            className="absolute left-0 right-0 flex justify-center"
            style={{ top: '74%' }}
          >
            <StarRating rating={player.rating} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
