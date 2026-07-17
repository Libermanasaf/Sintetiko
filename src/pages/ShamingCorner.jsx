import React, { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Laugh, Megaphone, Save, Pencil, X, User } from 'lucide-react';
import { toast } from 'sonner';
import { Player } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/AuthContext';
import { PageHeader, SectionTitle, LuxCard, Skeleton } from '@/components/ui/lux';

// Technical roster rows that must never be "shamed"
const EXCLUDED = new Set(['שוער', 'משתמש בדיקה']);

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
  const { role, loginMode } = useAuth();
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
