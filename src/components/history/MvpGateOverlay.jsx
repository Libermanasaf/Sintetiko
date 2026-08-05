import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, X, Loader2, Check } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Shown over a closed round's page when the logged-in player PLAYED in it but
// hasn't yet voted for the MVP. The page behind is blurred. Flow:
//   1) PICK  — tap a teammate to select them. You can't vote for yourself
//              (hidden here + blocked server-side).
//   2) CONFIRM — we name the pick back and ask כן/לא, because the vote is FINAL
//              (server is idempotent once you've voted). "לא" returns to PICK.
//   3) RESULTS — after voting we load mvp_vote_tally and show who got how many
//              votes, with ✓ on your own pick. "המשך" reveals the round.
// A ✕ backs out to history without revealing the result (vote still required
// next time — unless you already voted, in which case we jump to results).
export default function MvpGateOverlay({ round, players, currentPlayer, onVoted, onClose }) {
  const [pending, setPending] = useState(null); // candidate awaiting כן/לא confirmation
  const [casting, setCasting] = useState(null); // candidate id being cast
  const [tally, setTally] = useState(null);      // [{candidate_id, votes, is_mine}] once voted

  const candidates = (round.teams || [])
    .flat()
    .filter((pid) => pid !== currentPlayer?.id) // can't vote for yourself
    .map((pid) => players.find((p) => p.id === pid))
    .filter(Boolean);

  const nameOf = (id) => players.find((p) => p.id === id)?.name || 'שחקן';
  const imgOf = (id) => players.find((p) => p.id === id)?.image;

  const loadTally = async () => {
    const { data, error } = await supabase.rpc('mvp_vote_tally', { p_round_id: round.id });
    if (error) {
      // Vote landed but tally failed — don't trap the user; just reveal the round.
      console.warn('[mvp tally]', error.message);
      onVoted();
      return;
    }
    setTally(data || []);
  };

  const vote = async (candidateId) => {
    if (casting) return;
    setCasting(candidateId);
    try {
      const { error } = await supabase.rpc('cast_mvp_vote', {
        p_round_id: round.id,
        p_candidate_id: candidateId,
      });
      if (error) throw error;
      // Refresh the round data in the background, then show the results table.
      onVoted({ keepOpen: true });
      await loadTally();
    } catch (e) {
      toast.error('ההצבעה נכשלה', { description: e.message });
      setCasting(null);
      setPending(null); // back to the list so they can pick again
    }
  };

  const maxVotes = tally && tally.length ? Math.max(...tally.map((t) => t.votes)) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
    >
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        className="w-full max-w-sm st-card p-5 max-h-[88dvh] overflow-y-auto overscroll-contain relative"
        style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <button onClick={onClose} aria-label="סגור"
          className="absolute top-3 left-3 grid place-items-center w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 active:scale-95 z-10">
          <X className="w-4 h-4" />
        </button>

        {tally === null && pending ? (
          /* ── STEP 2: CONFIRM ────────────────────────────────────────── */
          <>
            <div className="text-center mb-5 mt-1">
              <div className="grid place-items-center w-14 h-14 mx-auto mb-3 rounded-2xl st-foil shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)]">
                <Trophy className="w-6 h-6" />
              </div>
              <h2 className="font-black text-white text-lg leading-tight">
                בחרת ב"{pending.name}"
              </h2>
              <p className="text-ink-3 text-sm font-bold mt-2">אתה בטוח?</p>
              <p className="text-ink-3 text-[0.7rem] font-bold mt-1 opacity-70">הבחירה סופית ולא ניתנת לשינוי</p>
            </div>

            <div className="flex items-center justify-center gap-3 mb-5">
              {pending.image ? (
                <img src={pending.image} alt={pending.name} className="w-16 h-16 rounded-2xl object-cover ring-1 ring-amber-400/40" />
              ) : (
                <div className="grid place-items-center w-16 h-16 rounded-2xl bg-slate-700 text-slate-300 font-black text-xl ring-1 ring-amber-400/40">
                  {(pending.name?.[0] || '?').toUpperCase()}
                </div>
              )}
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setPending(null)}
                disabled={!!casting}
                className="flex-1 min-h-[48px] rounded-2xl ring-1 ring-white/10 bg-slate-800/70 text-white font-black active:scale-[0.99] transition-transform disabled:opacity-50"
              >
                לא
              </button>
              <button
                onClick={() => vote(pending.id)}
                disabled={!!casting}
                className="flex-1 min-h-[48px] rounded-2xl st-foil font-black active:scale-[0.99] transition-transform shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)] disabled:opacity-50"
              >
                {casting ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (
                  'כן'
                )}
              </button>
            </div>
          </>
        ) : tally === null ? (
          /* ── STEP 1: PICK ───────────────────────────────────────────── */
          <>
            <div className="text-center mb-4 mt-1">
              <div className="grid place-items-center w-14 h-14 mx-auto mb-3 rounded-2xl st-foil shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)]">
                <Trophy className="w-6 h-6" />
              </div>
              <h2 className="font-black text-white text-lg leading-tight">רגע לפני שתראו את התוצאות</h2>
              <p className="text-ink-3 text-sm font-bold mt-1">בחר את השחקן המצטיין של המחזור 🌟</p>
              <p className="text-ink-3 text-[0.7rem] font-bold mt-1 opacity-70">הבחירה סופית ולא ניתנת לשינוי</p>
            </div>

            <div className="space-y-2">
              {candidates.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPending(p)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl ring-1 ring-white/8 bg-slate-800/50 text-right active:scale-[0.99] hover:bg-amber-500/10 hover:ring-amber-400/30 transition-all touch-manipulation"
                >
                  {p.image ? (
                    <img src={p.image} alt={p.name} className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10 shrink-0" />
                  ) : (
                    <div className="grid place-items-center w-9 h-9 rounded-lg bg-slate-700 text-slate-300 font-black text-sm shrink-0">
                      {(p.name?.[0] || '?').toUpperCase()}
                    </div>
                  )}
                  <span className="font-black text-white text-sm flex-1 truncate">{p.name}</span>
                  <Star className="w-4 h-4 text-slate-600 shrink-0" />
                </button>
              ))}
            </div>
          </>
        ) : (
          /* ── STEP 2: RESULTS ────────────────────────────────────────── */
          <>
            <div className="text-center mb-4 mt-1">
              <div className="grid place-items-center w-14 h-14 mx-auto mb-3 rounded-2xl st-foil shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)]">
                <Trophy className="w-6 h-6" />
              </div>
              <h2 className="font-black text-white text-lg leading-tight">הקול שלך נספר! 🌟</h2>
              <p className="text-ink-3 text-sm font-bold mt-1">ככה הצביעו למצטיין המחזור</p>
            </div>

            {tally.length === 0 ? (
              <p className="text-center text-ink-3 text-sm font-bold py-6">אין עדיין קולות</p>
            ) : (
              <div className="space-y-2">
                {tally.map((t) => {
                  const isLeader = t.votes === maxVotes && maxVotes > 0;
                  return (
                    <div
                      key={t.candidate_id}
                      className={`flex items-center gap-3 p-2.5 rounded-xl ring-1 transition-all ${
                        t.is_mine
                          ? 'bg-amber-500/15 ring-amber-400/40'
                          : 'bg-slate-800/50 ring-white/8'
                      }`}
                    >
                      {imgOf(t.candidate_id) ? (
                        <img src={imgOf(t.candidate_id)} alt="" className="w-9 h-9 rounded-lg object-cover ring-1 ring-white/10 shrink-0" />
                      ) : (
                        <div className="grid place-items-center w-9 h-9 rounded-lg bg-slate-700 text-slate-300 font-black text-sm shrink-0">
                          {(nameOf(t.candidate_id)?.[0] || '?').toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-white text-sm truncate">{nameOf(t.candidate_id)}</span>
                          {isLeader && <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                        {t.is_mine && (
                          <span className="flex items-center gap-0.5 text-amber-300 text-[0.65rem] font-black mt-0.5">
                            <Check className="w-3 h-3" strokeWidth={3} />הבחירה שלך
                          </span>
                        )}
                      </div>
                      <span className="grid place-items-center min-w-[2rem] h-7 px-2 rounded-lg bg-slate-900/70 ring-1 ring-white/10 text-white font-black text-sm tnum shrink-0">
                        {t.votes}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => onVoted()}
              className="w-full min-h-[48px] mt-4 rounded-2xl st-foil font-black active:scale-[0.99] transition-transform shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)]"
            >
              ראה את המחזור
            </button>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
