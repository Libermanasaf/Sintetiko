import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Lock, Users, Play, Eye, EyeOff, Loader2, User, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { PageHeader, Skeleton, EmptyState } from '@/components/ui/lux';
import { toast } from 'sonner';

const AWARD_ID = '2026';
const CATEGORIES = [
  { key: 'player',       label: 'שחקן העונה' },
  { key: 'breakthrough', label: 'הגילוי של העונה' },
];

function Avatar({ player, size = 'w-16 h-16', ring = 'ring-amber-400/50' }) {
  return player?.image ? (
    <img src={player.image} alt={player.name} loading="lazy"
      className={`${size} rounded-2xl object-cover ring-2 ${ring} shrink-0`} />
  ) : (
    <div className={`${size} rounded-2xl bg-slate-700 grid place-items-center ring-2 ${ring} shrink-0`}>
      <User className="w-6 h-6 text-slate-400" />
    </div>
  );
}

// The reveal itself: third place first, then second, then the winner — each
// step is a deliberate tap so the room can react between them.
function Reveal({ rows, label }) {
  const [shown, setShown] = useState(0); // how many places are revealed
  const top3 = rows.slice(0, 3);
  const order = [2, 1, 0].slice(3 - Math.min(3, top3.length)); // 3rd, 2nd, 1st

  if (!top3.length) {
    return <p className="text-center text-ink-3 text-sm font-bold py-8">אין קולות בקטגוריה הזו</p>;
  }

  const revealed = order.slice(0, shown);
  const done = shown >= order.length;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {revealed.map((idx) => {
          const r = rows[idx];
          const place = idx + 1;
          const isWinner = idx === 0;
          return (
            <motion.div
              key={r.candidate_id}
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', damping: 18, stiffness: 200 }}
              className={`flex items-center gap-3 rounded-2xl p-3 ring-1 ${
                isWinner
                  ? 'st-card ring-amber-300/50 shadow-[0_0_40px_-10px_rgba(250,204,21,0.6)]'
                  : 'bg-slate-800/60 ring-white/10'
              }`}
            >
              <span className={`grid place-items-center shrink-0 rounded-xl font-black tnum ${
                isWinner ? 'st-foil w-12 h-12 text-xl' : 'bg-slate-700 text-slate-300 w-10 h-10'
              }`}>
                {place}
              </span>
              <Avatar player={{ name: r.name, image: r.image }} size={isWinner ? 'w-20 h-20' : 'w-14 h-14'} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={`font-black truncate ${isWinner ? 'text-white text-lg' : 'text-white text-sm'}`}>
                    {r.name}
                  </p>
                  {isWinner && <Crown className="w-5 h-5 text-amber-300 shrink-0" strokeWidth={2.6} />}
                </div>
                <p className="text-ink-3 text-xs font-bold tnum mt-0.5">{r.votes} קולות</p>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {!done && (
        <button
          onClick={() => setShown((s) => s + 1)}
          className="w-full min-h-[52px] rounded-2xl st-foil font-black text-base active:scale-[0.99] transition-transform shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)]"
        >
          {shown === 0
            ? `חשוף את המקום ה-${order.length}  🥉`
            : shown === order.length - 1
              ? `חשוף את הזוכה — ${label} 🏆`
              : 'חשוף את המקום הבא'}
        </button>
      )}
    </div>
  );
}

export default function SeasonCeremony() {
  const { role, loginMode } = useAuth();
  const isAdmin = role === 'admin' && loginMode !== 'player';
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data: award, isLoading } = useQuery({
    queryKey: ['season-award', AWARD_ID],
    queryFn: async () => {
      if (!supabase) return null;
      const { data } = await supabase
        .from('season_awards').select('*').eq('id', AWARD_ID).maybeSingle();
      return data;
    },
  });

  // Turnout only — never a candidate breakdown, so watching the count come in
  // cannot tell the admin who is winning before the reveal.
  const { data: turnout = [] } = useQuery({
    queryKey: ['season-turnout', AWARD_ID],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.rpc('season_award_turnout', { p_award_id: AWARD_ID });
      if (error) return [];
      return data || [];
    },
    enabled: isAdmin,
    refetchInterval: isAdmin ? 30_000 : false,
  });

  const { data: results = [], isLoading: loadingResults } = useQuery({
    queryKey: ['season-results', AWARD_ID, award?.results_shown],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.rpc('season_award_results', { p_award_id: AWARD_ID });
      if (error) { console.warn('[results]', error.message); return []; }
      return data || [];
    },
    enabled: !!award && (award.results_shown || isAdmin),
  });

  const byCategory = useMemo(() => {
    const m = {};
    for (const r of results) (m[r.category] ||= []).push(r);
    return m;
  }, [results]);

  const turnoutFor = (key) =>
    Number(turnout.find((t) => t.category === key)?.voters || 0);

  const setFlag = async (patch, message) => {
    setBusy(true);
    try {
      const { error } = await supabase
        .from('season_awards').update(patch).eq('id', AWARD_ID);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['season-award', AWARD_ID] });
      await queryClient.invalidateQueries({ queryKey: ['season-results', AWARD_ID] });
      toast.success(message);
    } catch (e) {
      toast.error('הפעולה נכשלה', { description: e.message });
    } finally {
      setBusy(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  if (!award) {
    return (
      <div className="pb-10">
        <PageHeader icon={Trophy} title="טקס נבחרי העונה" accent="amber" />
        <div className="p-4">
          <EmptyState icon={Trophy} title="אין טקס מוגדר" hint="צור הצבעה כדי להתחיל." />
        </div>
      </div>
    );
  }

  return (
    <div className="pb-10">
      <PageHeader
        icon={Trophy}
        title={award.title}
        subtitle={award.results_shown ? 'התוצאות' : 'הטקס'}
        accent="amber"
      />

      <div className="p-4 space-y-4">
        {isAdmin && (
          <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/10 p-4 space-y-3">
            <p className="font-black text-white text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-amber-400" /> ניהול הטקס
            </p>

            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((c) => (
                <div key={c.key} className="rounded-xl bg-slate-800/60 ring-1 ring-white/8 p-2.5 text-center">
                  <p className="text-white font-black text-lg tnum leading-none">{turnoutFor(c.key)}</p>
                  <p className="text-ink-3 text-[0.6rem] font-bold mt-1">הצביעו · {c.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setFlag({ is_open: !award.is_open },
                  award.is_open ? 'ההצבעה נסגרה' : 'ההצבעה נפתחה')}
                disabled={busy}
                className={`min-h-[46px] rounded-xl font-black text-sm ring-1 active:scale-[0.99] disabled:opacity-50 ${
                  award.is_open
                    ? 'bg-rose-500/15 ring-rose-400/30 text-rose-300'
                    : 'bg-emerald-500/15 ring-emerald-400/30 text-emerald-300'
                }`}
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                  : award.is_open ? '🔒 סגור הצבעה' : '🔓 פתח הצבעה'}
              </button>

              <button
                onClick={() => setFlag({ results_shown: !award.results_shown },
                  award.results_shown ? 'התוצאות הוסתרו' : 'התוצאות נחשפו לכולם')}
                disabled={busy || award.is_open}
                title={award.is_open ? 'סגור קודם את ההצבעה' : undefined}
                className="min-h-[46px] rounded-xl font-black text-sm ring-1 bg-amber-500/15 ring-amber-400/30 text-amber-300 active:scale-[0.99] disabled:opacity-40"
              >
                {award.results_shown
                  ? <span className="flex items-center justify-center gap-1.5"><EyeOff className="w-4 h-4" /> הסתר תוצאות</span>
                  : <span className="flex items-center justify-center gap-1.5"><Eye className="w-4 h-4" /> חשוף תוצאות</span>}
              </button>
            </div>

            {award.is_open && (
              <p className="text-ink-3 text-[0.68rem] font-bold leading-relaxed">
                ההצבעה פתוחה. סגור אותה לפני חשיפת התוצאות — כך אף אחד לא מצביע
                אחרי שראה מי מוביל.
              </p>
            )}
          </div>
        )}

        {!award.results_shown && !isAdmin ? (
          <EmptyState
            icon={Lock}
            title="התוצאות עדיין סגורות"
            hint={award.is_open
              ? 'ההצבעה עדיין פתוחה. התוצאות ייחשפו בטקס.'
              : 'ההצבעה הסתיימה. התוצאות ייחשפו בטקס.'}
          />
        ) : loadingResults ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          CATEGORIES.map((c) => (
            <div key={c.key} className="space-y-2.5">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-amber-400" />
                <h2 className="font-black text-white text-base">{c.label}</h2>
              </div>
              <Reveal rows={byCategory[c.key] || []} label={c.label} />
            </div>
          ))
        )}
      </div>
    </div>
  );
}
