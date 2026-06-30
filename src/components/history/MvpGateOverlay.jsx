import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Shown over a closed round's page when the logged-in player PLAYED in it but
// hasn't yet voted for the MVP. The page behind is blurred; picking a player
// (one tap) casts the vote via cast_mvp_vote and reveals the round. A small ✕
// lets them back out to history without seeing the result (vote still required
// next time). Self-vote is blocked server-side and hidden from the list here.
export default function MvpGateOverlay({ round, players, currentPlayer, onVoted, onClose }) {
  const [casting, setCasting] = useState(null); // candidate id being cast
  const candidates = (round.teams || [])
    .flat()
    .filter((pid) => pid !== currentPlayer?.id) // can't vote for yourself
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean);

  const vote = async (candidateId) => {
    if (casting) return;
    setCasting(candidateId);
    try {
      const { error } = await supabase.rpc('cast_mvp_vote', {
        p_round_id: round.id,
        p_candidate_id: candidateId,
      });
      if (error) throw error;
      onVoted();
    } catch (e) {
      toast.error('ההצבעה נכשלה', { description: e.message });
      setCasting(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        className="w-full max-w-sm st-card p-5 max-h-[88dvh] overflow-y-auto overscroll-contain"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button onClick={onClose} aria-label="סגור"
          className="absolute top-3 left-3 grid place-items-center w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 active:scale-95">
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-4 mt-1">
          <div className="grid place-items-center w-14 h-14 mx-auto mb-3 rounded-2xl st-foil shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)]">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="font-black text-white text-lg leading-tight">רגע לפני שתראו את התוצאות</h2>
          <p className="text-ink-3 text-sm font-bold mt-1">בחר את השחקן המצטיין של המחזור 🌟</p>
        </div>

        <div className="space-y-2">
          {candidates.map((p) => (
            <button
              key={p.id}
              onClick={() => vote(p.id)}
              disabled={!!casting}
              className="w-full flex items-center gap-3 p-3 rounded-xl ring-1 ring-white/8 bg-slate-800/50 text-right active:scale-[0.99] hover:bg-amber-500/10 hover:ring-amber-400/30 transition-all touch-manipulation disabled:opacity-50"
            >
              {p.image ? (
                <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10 shrink-0" />
              ) : (
                <div className="grid place-items-center w-9 h-9 rounded-lg bg-slate-700 text-slate-300 font-black text-sm shrink-0">
                  {(p.name?.[0] || '?').toUpperCase()}
                </div>
              )}
              <span className="font-black text-white text-sm flex-1 truncate">{p.name}</span>
              {casting === p.id
                ? <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0" />
                : <Star className="w-4 h-4 text-slate-600 shrink-0" />}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
