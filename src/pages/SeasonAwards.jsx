import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Search, X, Check, Loader2, Lock, Sparkles, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { PageHeader, Skeleton, EmptyState } from '@/components/ui/lux';
import { toast } from 'sonner';

const AWARD_ID = '2026';

// Two awards, voted separately. Every logged-in player may vote in both —
// being a candidate is earned (10+ rounds), voting is not.
const CATEGORIES = [
  { key: 'player',       label: 'שחקן העונה',      hint: 'מי היה השחקן הכי טוב העונה' },
  { key: 'breakthrough', label: 'הגילוי של העונה', hint: 'מי הפתיע, השתפר או פרץ העונה' },
];

function Avatar({ player, size = 'w-14 h-14' }) {
  return player?.image ? (
    <img src={player.image} alt={player.name} loading="lazy"
      className={`${size} rounded-xl object-cover ring-2 ring-amber-400/40 shrink-0`} />
  ) : (
    <div className={`${size} rounded-xl bg-slate-700 grid place-items-center ring-2 ring-amber-400/40 shrink-0`}>
      <User className="w-5 h-5 text-slate-400" />
    </div>
  );
}

// Names the pick back and asks before sending, because the vote is final.
function ConfirmVote({ candidate, category, onCancel, onConfirm, saving }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onCancel}
    >
      <motion.div
        initial={{ y: 24, opacity: 0, scale: 0.97 }} animate={{ y: 0, opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm st-card p-5 text-center"
      >
        <div className="grid place-items-center w-14 h-14 mx-auto mb-3 rounded-2xl st-foil">
          <Trophy className="w-6 h-6" />
        </div>
        <h2 className="font-black text-white text-lg leading-tight">
          בחרת ב"{candidate.name}"
        </h2>
        <p className="text-ink-3 text-sm font-bold mt-1">ל{category.label}</p>
        <p className="text-ink-3 text-sm font-bold mt-3">אתה בטוח?</p>
        <p className="text-ink-3 text-[0.7rem] font-bold mt-1 opacity-70">
          ההצבעה סופית ולא ניתנת לשינוי
        </p>

        <div className="flex items-center justify-center gap-3 my-4">
          <Avatar player={candidate} size="w-16 h-16" />
        </div>

        <div className="flex gap-2.5">
          <button onClick={onCancel} disabled={saving}
            className="flex-1 min-h-[48px] rounded-2xl ring-1 ring-white/10 bg-slate-800/70 text-white font-black active:scale-[0.99] disabled:opacity-50">
            לא
          </button>
          <button onClick={onConfirm} disabled={saving}
            className="flex-1 min-h-[48px] rounded-2xl st-foil font-black active:scale-[0.99] disabled:opacity-50">
            {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'כן'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function SeasonAwards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeCat, setActiveCat] = useState(CATEGORIES[0].key);
  const [search, setSearch] = useState('');
  const [pending, setPending] = useState(null);
  const [saving, setSaving] = useState(false);

  const { data: award, isLoading: loadingAward } = useQuery({
    queryKey: ['season-award', AWARD_ID],
    queryFn: async () => {
      if (!supabase) return null;
      const { data } = await supabase
        .from('season_awards').select('*').eq('id', AWARD_ID).maybeSingle();
      return data;
    },
  });

  const { data: candidates = [], isLoading: loadingCandidates } = useQuery({
    queryKey: ['season-candidates', AWARD_ID],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.rpc('season_award_candidates', { p_award_id: AWARD_ID });
      if (error) { console.warn('[candidates]', error.message); return []; }
      return data || [];
    },
    staleTime: 10 * 60_000,
  });

  // What this voter already chose — the server is the only source, so a
  // refresh or a second device shows the same answer.
  const { data: myVotes = [] } = useQuery({
    queryKey: ['my-season-votes', AWARD_ID, user?.id],
    queryFn: async () => {
      if (!supabase || !user) return [];
      const { data, error } = await supabase.rpc('my_season_votes', { p_award_id: AWARD_ID });
      if (error) { console.warn('[my votes]', error.message); return []; }
      return data || [];
    },
    enabled: !!user,
  });

  const myVoteFor = useMemo(
    () => Object.fromEntries(myVotes.map((v) => [v.category, v.candidate_id])),
    [myVotes]
  );

  const category = CATEGORIES.find((c) => c.key === activeCat);
  const alreadyVoted = myVoteFor[activeCat];
  const votedCandidate = candidates.find((c) => c.id === alreadyVoted);

  const q = search.trim().toLowerCase();
  const visible = q
    ? candidates.filter((c) => (c.name || '').toLowerCase().includes(q))
    : candidates;

  const submit = async () => {
    if (!pending) return;
    setSaving(true);
    try {
      const { error } = await supabase.rpc('cast_season_vote', {
        p_award_id: AWARD_ID,
        p_category: activeCat,
        p_candidate_id: pending.id,
      });
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['my-season-votes', AWARD_ID, user?.id] });
      toast.success(`הקול שלך ל${category.label} נקלט ✅`);
      setPending(null);
    } catch (e) {
      toast.error('ההצבעה נכשלה', { description: e.message });
    } finally {
      setSaving(false);
    }
  };

  const isLoading = loadingAward || loadingCandidates;
  const votingOpen = !!award?.is_open
    && (!award?.closes_at || new Date(award.closes_at) > new Date());

  return (
    <div className="pb-10">
      <PageHeader
        icon={Trophy}
        title={award?.title || 'נבחרי העונה'}
        subtitle="ההצבעה של השחקנים"
        accent="amber"
      />

      <div className="p-4 space-y-4">
        {isLoading ? (
          <div className="space-y-2.5">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)}
          </div>
        ) : !award ? (
          <EmptyState icon={Trophy} title="אין הצבעה פעילה"
            hint="כשתיפתח ההצבעה לנבחרי העונה, היא תופיע כאן." />
        ) : !votingOpen ? (
          <EmptyState icon={Lock} title="ההצבעה סגורה"
            hint={award.results_shown
              ? 'ההצבעה הסתיימה. התוצאות נחשפו בטקס.'
              : 'ההצבעה עדיין לא נפתחה. תקבל התראה כשהיא תיפתח.'} />
        ) : (
          <>
            {/* category tabs */}
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => {
                const done = !!myVoteFor[c.key];
                const active = c.key === activeCat;
                return (
                  <button
                    key={c.key}
                    onClick={() => { setActiveCat(c.key); setSearch(''); }}
                    className={`relative rounded-xl px-3 py-2.5 font-black text-sm transition-all ring-1 ${
                      active
                        ? 'st-foil ring-amber-300/50'
                        : 'bg-slate-800/60 ring-white/10 text-slate-300'
                    }`}
                  >
                    {c.label}
                    {done && (
                      <span className="absolute top-1 left-1 grid place-items-center w-4 h-4 rounded-full bg-emerald-500">
                        <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {alreadyVoted ? (
              <div className="rounded-2xl bg-emerald-500/10 ring-1 ring-emerald-400/30 p-5 text-center">
                <div className="grid place-items-center w-12 h-12 mx-auto mb-3 rounded-2xl bg-emerald-500/20">
                  <Check className="w-6 h-6 text-emerald-300" strokeWidth={3} />
                </div>
                <p className="text-white font-black">הצבעת ל{category.label}</p>
                {votedCandidate && (
                  <div className="flex items-center justify-center gap-2.5 mt-3">
                    <Avatar player={votedCandidate} size="w-11 h-11" />
                    <span className="text-emerald-300 font-black">{votedCandidate.name}</span>
                  </div>
                )}
                <p className="text-ink-3 text-xs font-bold mt-3">
                  התוצאות ייחשפו בטקס נבחרי העונה 🏆
                </p>
              </div>
            ) : (
              <>
                <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/8 ring-1 ring-amber-500/20 px-3.5 py-2.5">
                  <Trophy className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-amber-200/80 text-xs font-bold leading-relaxed">
                    {category.hint}. בחר שחקן אחד — ההצבעה סופית, ואי אפשר להצביע לעצמך.
                    התוצאות נחשפות רק בטקס.
                  </p>
                </div>

                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="חפש שחקן לפי שם…"
                    dir="rtl"
                    className="w-full h-12 pr-9 pl-9 rounded-xl bg-slate-800/70 ring-1 ring-white/10 text-white text-sm font-bold placeholder:text-slate-500 outline-none focus:ring-amber-400/40 transition-all"
                  />
                  {search && (
                    <button onClick={() => setSearch('')} aria-label="נקה חיפוש"
                      className="absolute left-2.5 top-1/2 -translate-y-1/2 grid place-items-center w-7 h-7 rounded-md bg-slate-700/80 text-slate-400 active:scale-95">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {visible.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setPending(c)}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl ring-1 ring-white/8 bg-slate-800/50 text-right active:scale-[0.99] hover:bg-amber-500/10 hover:ring-amber-400/30 transition-all"
                    >
                      <Avatar player={c} />
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-white text-sm truncate">{c.name}</p>
                        <p className="text-ink-3 text-[0.7rem] font-bold mt-0.5 tnum">
                          {c.wins} נצחונות · {c.appearances} הופעות
                        </p>
                      </div>
                      <Sparkles className="w-4 h-4 text-slate-600 shrink-0" />
                    </button>
                  ))}
                  {visible.length === 0 && (
                    <p className="text-center text-slate-400 text-sm font-bold py-10">
                      לא נמצא שחקן בשם "{search.trim()}"
                    </p>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {pending && (
          <ConfirmVote
            candidate={pending}
            category={category}
            saving={saving}
            onCancel={() => !saving && setPending(null)}
            onConfirm={submit}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
