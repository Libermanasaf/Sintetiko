import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, EyeOff, UserRound, Trash2, Inbox, Loader2, CheckCircle2,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { callApi } from '@/lib/apiClient';

const MAX_LEN = 1000;

const DATE_FMT = (d) =>
  new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
    .format(new Date(d));

// ── Player view: write to the admin, anonymously or identified ──────────────
function ComplaintForm() {
  const [anonymous, setAnonymous] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    const clean = body.trim();
    if (clean.length < 3) { toast.error('כתוב לפחות כמה מילים 🙂'); return; }
    setSending(true);
    try {
      const { error } = await supabase.rpc('submit_complaint', {
        p_body: clean,
        p_anonymous: anonymous,
      });
      if (error) throw error;

      // Heads-up push to the admin. Content stays generic — the message itself
      // is read inside the app (and stays anonymous when the sender chose so).
      try {
        await callApi('/api/send-notification', {
          targetEmail: 'libermanasaf@gmail.com',
          title: 'תיבת התלונות 📬',
          body: anonymous ? 'התקבלה פנייה אנונימית חדשה' : 'התקבלה פנייה חדשה',
          url: '/ComplaintsBox',
        });
      } catch (e) { console.warn('[complaint push]', e); }

      setSent(true);
      setBody('');
    } catch (e) {
      toast.error('השליחה נכשלה', { description: e.message });
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
        className="st-card p-8 text-center"
      >
        <div className="grid place-items-center w-16 h-16 mx-auto mb-4 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/30">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="font-black text-white text-lg mb-2">הפנייה נשלחה!</h2>
        <p className="text-ink-2 text-sm leading-relaxed mb-6">
          {anonymous
            ? 'ההודעה הועברה באופן אנונימי לחלוטין — הזהות שלך לא נשמרה.'
            : 'ההודעה הועברה למנהל עם השם שלך.'}
        </p>
        <button
          onClick={() => setSent(false)}
          className="min-h-[48px] px-6 rounded-2xl bg-slate-800 ring-1 ring-white/10 text-slate-200 font-black active:scale-[0.99] transition-transform"
        >
          שלח פנייה נוספת
        </button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Identity choice */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => setAnonymous(false)}
          className={`p-4 rounded-2xl ring-1 text-center transition-all active:scale-[0.99] touch-manipulation ${
            !anonymous
              ? 'bg-amber-500/15 ring-amber-400/40 shadow-[0_6px_20px_-8px_rgba(250,204,21,0.5)]'
              : 'bg-slate-900/60 ring-white/8'
          }`}
        >
          <UserRound className={`w-6 h-6 mx-auto mb-2 ${!anonymous ? 'text-amber-300' : 'text-slate-500'}`} />
          <span className={`block font-black text-sm ${!anonymous ? 'text-amber-200' : 'text-slate-400'}`}>עם השם שלי</span>
          <span className="block text-[0.65rem] font-bold text-ink-3 mt-1">המנהל יראה מי שלח</span>
        </button>
        <button
          type="button"
          onClick={() => setAnonymous(true)}
          className={`p-4 rounded-2xl ring-1 text-center transition-all active:scale-[0.99] touch-manipulation ${
            anonymous
              ? 'bg-sky-500/15 ring-sky-400/40 shadow-[0_6px_20px_-8px_rgba(56,189,248,0.5)]'
              : 'bg-slate-900/60 ring-white/8'
          }`}
        >
          <EyeOff className={`w-6 h-6 mx-auto mb-2 ${anonymous ? 'text-sky-300' : 'text-slate-500'}`} />
          <span className={`block font-black text-sm ${anonymous ? 'text-sky-200' : 'text-slate-400'}`}>אנונימי</span>
          <span className="block text-[0.65rem] font-bold text-ink-3 mt-1">הזהות לא נשמרת כלל</span>
        </button>
      </div>

      {/* Message */}
      <div className="st-card p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value.slice(0, MAX_LEN))}
          placeholder="כתוב כאן מה שעל ליבך — תלונה, הצעה, או כל דבר אחר..."
          rows={6}
          dir="rtl"
          className="w-full bg-transparent text-white text-sm font-medium placeholder:text-white/25 outline-none resize-none leading-relaxed"
        />
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
          <span className="text-[0.65rem] font-bold text-ink-3 tnum">{body.length}/{MAX_LEN}</span>
          <span className="text-[0.65rem] font-bold text-ink-3">
            {anonymous ? '🕶 נשלח אנונימית' : '🙋 נשלח עם השם שלך'}
          </span>
        </div>
      </div>

      <button
        onClick={submit}
        disabled={sending || body.trim().length < 3}
        className="w-full min-h-[52px] rounded-2xl st-foil font-black text-base active:scale-[0.99] transition-transform disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_10px_28px_-10px_rgba(250,204,21,0.7)]"
      >
        {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
        שלח למנהל
      </button>
    </div>
  );
}

// ── Admin view: the inbox ────────────────────────────────────────────────────
function ComplaintsInbox() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_complaints');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  const remove = async (id) => {
    setDeletingId(id);
    try {
      const { error } = await supabase.rpc('delete_complaint', { p_id: id });
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      toast.success('הפנייה נמחקה');
    } catch (e) {
      toast.error('המחיקה נכשלה', { description: e.message });
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-2.5">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
      </div>
    );
  }

  if (complaints.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="אין פניות כרגע"
        hint="כשחקן ישלח פנייה דרך תיבת התלונות — היא תופיע כאן ותקבל התראה."
      />
    );
  }

  return (
    <div className="space-y-2.5">
      <AnimatePresence>
        {complaints.map((c) => (
          <motion.div
            key={c.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="st-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              {c.player_name ? (
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-black px-2 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 text-amber-300">
                  <UserRound className="w-3 h-3" />{c.player_name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[0.65rem] font-black px-2 py-0.5 rounded-full bg-sky-500/15 ring-1 ring-sky-400/30 text-sky-300">
                  <EyeOff className="w-3 h-3" />אנונימי
                </span>
              )}
              <span className="text-[0.65rem] font-bold text-ink-3 tnum">{DATE_FMT(c.created_date)}</span>
              <button
                onClick={() => remove(c.id)}
                disabled={deletingId === c.id}
                aria-label="מחק פנייה"
                className="mr-auto grid place-items-center w-8 h-8 rounded-lg bg-slate-800/70 text-slate-500 hover:text-rose-400 active:scale-95 transition-all disabled:opacity-50"
              >
                {deletingId === c.id
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
              </button>
            </div>
            <p className="text-white text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default function ComplaintsBox() {
  const { loginMode, role } = useAuth();
  const isAdmin = loginMode ? loginMode === 'admin' : role === 'admin';

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader
        icon={MessageSquare}
        title="תיבת התלונות"
        subtitle={isAdmin ? 'פניות מהשחקנים' : 'דבר איתי — גם באנונימיות מלאה'}
        accent="amber"
      />
      <div className="p-4 max-w-lg mx-auto">
        {isAdmin ? <ComplaintsInbox /> : <ComplaintForm />}
      </div>
    </div>
  );
}
