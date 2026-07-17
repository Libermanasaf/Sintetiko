import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Laugh, Megaphone, Save, Pencil, X, User, Vote, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Player } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { PageHeader, SectionTitle, LuxCard, Skeleton } from '@/components/ui/lux';

// Technical roster rows that must never be "shamed"
const EXCLUDED = new Set(['שוער', 'משתמש בדיקה']);

// The current shaming poll. Swap id+question for the next one — old votes
// stay keyed to the old poll_id, so history is never mixed.
const POLL = { id: 'liar', question: 'מי השחקן הכי שקרן? 🤥' };

function ShameRow({ player, value, place }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-b-0">
      <span className="text-lg font-black tnum text-rose-300/80 w-6 text-center shrink-0">{place}</span>
      {player.image ? (
        <img src={player.image} alt={player.name} loading="lazy" className="w-9 h-9 rounded-full object-cover shrink-0 ring-1 ring-white/10" />
      ) : (
        <div className="grid place-items-center w-9 h-9 rounded-full bg-slate-700 shrink-0">
          <User className="w-4 h-4 text-slate-400" />
        </div>
      )}
      <p className="flex-1 min-w-0 text-white font-black text-sm truncate">{player.name}</p>
      <span className="shrink-0 text-rose-200/90 text-xs font-bold tnum">{value}</span>
    </div>
  );
}

function ShameSection({ emoji, title, hint, children }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-base">{emoji}</span>
        <span className="text-rose-300/90 font-black text-sm">{title}</span>
      </div>
      {hint && <p className="text-ink-3 text-[0.65rem] font-bold px-1 mb-2">{hint}</p>}
      <div className="rounded-2xl bg-slate-900/70 ring-1 ring-rose-500/20 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

export default function ShamingCorner() {
  const { role, loginMode, user } = useAuth();
  const isAdmin = role === 'admin' && loginMode !== 'player';
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);

  const { data: board, isLoading } = useQuery({
    queryKey: ['shaming-state'],
    queryFn: async () => {
      if (!supabase) return null;
      const { data, error } = await supabase
        .from('shaming_state')
        .select('data, updated_at')
        .eq('id', 'main')
        .maybeSingle();
      if (error) { console.warn('[shaming]', error.message); return null; }
      return data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
  });
  const boardText = board?.data?.text || '';

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
  });

  // Shame stats from existing data — thresholds keep it fair-ish:
  // the desert needs 5+ games, the turtles 8+.
  const stats = useMemo(() => {
    const eligible = players.filter((p) => !EXCLUDED.has(p.name));
    const dry = eligible
      .filter((p) => (p.appearances || 0) >= 5 && (p.wins || 0) === 0)
      .sort((a, b) => (b.appearances || 0) - (a.appearances || 0))
      .slice(0, 3);
    const turtles = eligible
      .filter((p) => (p.appearances || 0) >= 8)
      .sort((a, b) =>
        (a.wins || 0) / (a.appearances || 1) - (b.wins || 0) / (b.appearances || 1))
      .slice(0, 3);
    return { dry, turtles };
  }, [players]);

  // ── The poll ──────────────────────────────────────────────────────────
  const [pollPick, setPollPick] = useState('');
  const [votingPoll, setVotingPoll] = useState(false);

  const { data: pollSummary = [] } = useQuery({
    queryKey: ['shame-poll', POLL.id],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase.rpc('shame_poll_summary', { p_poll_id: POLL.id });
      if (error) { console.warn('[shame poll]', error.message); return []; }
      return data || [];
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
  const totalPollVotes = pollSummary.reduce((s, v) => s + Number(v.vote_count), 0);
  const myPollVote = pollSummary.find((v) => v.is_mine)?.candidate_id || null;

  // My own player row — to block voting for yourself (nice try 🙂)
  const { data: myPlayer } = useQuery({
    queryKey: ['my-player', user?.id, user?.email],
    queryFn: async () => {
      if (!supabase || !user) return null;
      const { data } = await supabase
        .from('players').select('*').eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const castPollVote = async () => {
    if (!pollPick || !user) return;
    if (myPlayer && pollPick === myPlayer.id) {
      toast.error('להצביע לעצמך? יצירתי, אבל לא 🙂');
      return;
    }
    setVotingPoll(true);
    try {
      // SECURITY DEFINER RPC — same proven pattern as cast_mvp_vote; the
      // votes table itself has zero client access (stronger anonymity).
      const { error } = await supabase.rpc('cast_shame_vote', {
        p_poll_id: POLL.id,
        p_candidate_id: pollPick,
      });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['shame-poll', POLL.id] });
      toast.success('ההצבעה נקלטה — אנונימית לחלוטין 🤐');
      setPollPick('');
    } catch (e) {
      toast.error('ההצבעה נכשלה', { description: e?.message });
    } finally {
      setVotingPoll(false);
    }
  };

  const startEdit = () => { setDraft(boardText); setEditing(true); };

  const saveBoard = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('shaming_state')
        .upsert(
          { id: 'main', data: { text: draft.trim() }, updated_at: new Date().toISOString() },
          { onConflict: 'id' }
        );
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['shaming-state'] });
      setEditing(false);
      toast.success('השיימינג פורסם 😈');
    } catch (e) {
      toast.error('השמירה נכשלה', { description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  const winRate = (p) => Math.round(((p.wins || 0) / (p.appearances || 1)) * 100);

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader icon={Laugh} title="פינת השיימינג" subtitle="הכול באהבה 😉" accent="amber" />

      <div className="p-4 max-w-lg mx-auto space-y-6">
        {/* ── The admin's board ── */}
        <div>
          <SectionTitle icon={Megaphone} className="mb-3">על הלוח השבוע</SectionTitle>

          {isLoading ? (
            <Skeleton className="h-28 rounded-2xl" />
          ) : editing ? (
            <LuxCard accent="amber">
              <div className="p-4 space-y-3">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={6}
                  autoFocus
                  placeholder={'כתוב כאן את השיימינג השבועי…'}
                  className="w-full rounded-xl bg-slate-900/80 ring-1 ring-white/10 text-white text-sm font-medium p-3 outline-none focus:ring-amber-400/50 resize-none placeholder:text-white/20 leading-relaxed"
                  dir="rtl"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveBoard}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-1.5 min-h-[44px] rounded-xl st-foil font-black text-sm active:scale-[0.98] disabled:opacity-50 transition-transform touch-manipulation"
                  >
                    {saving
                      ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <Save className="w-4 h-4" />}
                    פרסם
                  </button>
                  <button
                    onClick={() => setEditing(false)}
                    disabled={saving}
                    className="grid place-items-center w-12 min-h-[44px] rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-300 active:scale-95 transition-transform touch-manipulation"
                    aria-label="ביטול"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </LuxCard>
          ) : (
            <LuxCard accent="amber" glow>
              <div className="p-4">
                {boardText ? (
                  <p className="text-slate-100 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">
                    {boardText}
                  </p>
                ) : (
                  <p className="text-ink-3 text-sm font-bold text-center py-2">
                    {isAdmin ? 'הלוח ריק — לחץ על העיפרון וכתוב את השיימינג הראשון 😈' : 'המנהל עוד לא פרסם שיימינג השבוע. תיזהרו — זה בדרך 😈'}
                  </p>
                )}
                <div className="mt-3 pt-2.5 border-t border-white/6 flex items-center justify-between">
                  <span className="text-[0.6rem] text-ink-3 font-bold">
                    {board?.updated_at
                      ? `עודכן ${new Date(board.updated_at).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' })}`
                      : ''}
                  </span>
                  {isAdmin && (
                    <button
                      onClick={startEdit}
                      className="flex items-center gap-1 text-amber-300 text-xs font-black active:scale-95 transition-transform touch-manipulation"
                    >
                      <Pencil className="w-3 h-3" />
                      ערוך
                    </button>
                  )}
                </div>
              </div>
            </LuxCard>
          )}
        </div>

        {/* ── The poll ── */}
        <div>
          <SectionTitle icon={Vote} className="mb-3">סקר השבוע</SectionTitle>
          <LuxCard accent="amber" glow>
            <div className="p-4">
              <p className="text-white font-black text-base text-center">{POLL.question}</p>

              {myPollVote ? (
                /* Results — visible once you've voted */
                <div className="mt-4 space-y-2.5">
                  {pollSummary.map((v) => {
                    const p = players.find((x) => x.id === v.candidate_id);
                    if (!p) return null;
                    const pct = totalPollVotes > 0 ? Math.round((Number(v.vote_count) / totalPollVotes) * 100) : 0;
                    const mine = v.candidate_id === myPollVote;
                    return (
                      <div key={v.candidate_id} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-black flex items-center gap-1.5 ${mine ? 'text-amber-300' : 'text-slate-200'}`}>
                            {p.name}
                            {mine && <span className="text-[0.55rem] st-foil px-1.5 py-0.5 rounded-full">ההצבעה שלי</span>}
                          </span>
                          <span className="text-ink-3 text-[0.62rem] font-bold tnum">{v.vote_count} · {pct}%</span>
                        </div>
                        <div className="h-6 bg-slate-800/80 rounded-lg overflow-hidden ring-1 ring-white/5">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: pct > 0 ? `${pct}%` : '4px' }}
                            transition={{ duration: 0.7, ease: 'easeOut' }}
                            className="h-full rounded-lg bg-gradient-to-l from-rose-500 to-rose-700"
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-center text-ink-3 text-[0.62rem] font-bold pt-1 tnum">
                    {totalPollVotes} הצבעות · אפשר לשנות הצבעה למטה
                  </p>
                  <div className="flex gap-2 pt-1">
                    <select
                      value={pollPick}
                      onChange={(e) => setPollPick(e.target.value)}
                      dir="rtl"
                      className="flex-1 min-h-[40px] rounded-xl bg-slate-900 ring-1 ring-white/10 text-white text-xs font-bold px-2 outline-none cursor-pointer"
                    >
                      <option value="">— שנה הצבעה —</option>
                      {[...players]
                        .filter((p) => !EXCLUDED.has(p.name))
                        .sort((a, b) => a.name.localeCompare(b.name, 'he'))
                        .map((p) => (
                          <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                        ))}
                    </select>
                    <button
                      onClick={castPollVote}
                      disabled={!pollPick || votingPoll}
                      className="shrink-0 px-4 min-h-[40px] rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30 text-rose-300 text-xs font-black active:scale-95 disabled:opacity-40 transition-transform touch-manipulation"
                    >
                      {votingPoll ? '...' : 'עדכן'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Voting — pick a player */
                <div className="mt-4 space-y-2.5">
                  <select
                    value={pollPick}
                    onChange={(e) => setPollPick(e.target.value)}
                    dir="rtl"
                    className="w-full min-h-[48px] rounded-xl bg-slate-900 ring-1 ring-white/10 text-white text-sm font-bold px-3 outline-none cursor-pointer"
                  >
                    <option value="">— בחר את השקרן —</option>
                    {[...players]
                      .filter((p) => !EXCLUDED.has(p.name))
                      .sort((a, b) => a.name.localeCompare(b.name, 'he'))
                      .map((p) => (
                        <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                      ))}
                  </select>
                  <button
                    onClick={castPollVote}
                    disabled={!pollPick || votingPoll}
                    className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl st-foil font-black text-sm active:scale-[0.98] disabled:opacity-50 transition-transform touch-manipulation"
                  >
                    {votingPoll
                      ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <Vote className="w-4 h-4" />}
                    הצבע
                  </button>
                  <p className="flex items-center justify-center gap-1.5 text-ink-3 text-[0.6rem] font-bold">
                    <Lock className="w-[11px] h-[11px]" strokeWidth={2.6} />
                    ההצבעה אנונימית לחלוטין — התוצאות ייחשפו לך אחרי שתצביע
                  </p>
                </div>
              )}
            </div>
          </LuxCard>
        </div>

        {/* ── Shame stats ── */}
        <div className="space-y-5">
          <SectionTitle icon={Laugh} className="mb-1">היכל הבושה הסטטיסטי</SectionTitle>

          {stats.dry.length > 0 && (
            <ShameSection
              emoji="🏜️"
              title="מדבר הגביעים"
              hint="הכי הרבה משחקים בלי גביע אחד (מינימום 5 הופעות)"
            >
              {stats.dry.map((p, i) => (
                <ShameRow key={p.id} player={p} place={i + 1} value={`${p.appearances} משחקים · 0 גביעים`} />
              ))}
            </ShameSection>
          )}

          {stats.turtles.length > 0 && (
            <ShameSection
              emoji="🐢"
              title="מועדון הצבים"
              hint="אחוז הניצחונות הנמוך במועדון (מינימום 8 הופעות)"
            >
              {stats.turtles.map((p, i) => (
                <ShameRow key={p.id} player={p} place={i + 1} value={`${winRate(p)}% מתוך ${p.appearances}`} />
              ))}
            </ShameSection>
          )}

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-center text-ink-3 text-[0.62rem] font-bold"
          >
            הנתונים מתעדכנים אוטומטית · הדרך היחידה לצאת מהפינה היא לנצח 🏆
          </motion.p>
        </div>
      </div>
    </div>
  );
}
