import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, EyeOff, UserRound, Trash2, Inbox, Loader2, CheckCircle2,
  Reply, Clock, ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { callApi } from '@/lib/apiClient';
import { Player } from '@/api/entities';

const MAX_LEN = 1000;

const DATE_FMT = (d) =>
  new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })
    .format(new Date(d));

// Device tokens for ANONYMOUS complaints: a random id saved only in this
// browser's localStorage and attached to the complaint. It lets the sender see
// the admin's reply on the same device — without the server ever knowing who
// they are. Identified complaints don't need it (matched by player row).
const TOKENS_KEY = 'sintetiko_complaint_tokens';
const loadTokens = () => {
  try { return JSON.parse(localStorage.getItem(TOKENS_KEY) || '[]'); } catch { return []; }
};
const saveToken = (t) => {
  try {
    const arr = [...loadTokens(), t].slice(-20); // keep the last 20
    localStorage.setItem(TOKENS_KEY, JSON.stringify(arr));
  } catch {}
};
const newToken = () =>
  (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

// ── Player: my complaints + admin replies ────────────────────────────────────
function MyComplaints() {
  const { data: mine = [], isLoading } = useQuery({
    queryKey: ['my-complaints'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_complaints', { p_tokens: loadTokens() });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  if (isLoading || mine.length === 0) return null;

  return (
    <div className="mt-6">
      <h3 className="font-black text-white text-sm mb-2.5 flex items-center gap-1.5">
        <Inbox className="w-4 h-4 text-amber-400" />
        הפניות שלי
      </h3>
      <div className="space-y-2.5">
        {mine.map((c) => (
          <div key={c.id} className="st-card p-4">
            <div className="flex items-center gap-2 mb-1.5">
              {c.was_anonymous ? (
                <span className="inline-flex items-center gap-1 text-[0.62rem] font-black px-2 py-0.5 rounded-full bg-sky-500/15 ring-1 ring-sky-400/30 text-sky-300">
                  <EyeOff className="w-3 h-3" />אנונימי
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[0.62rem] font-black px-2 py-0.5 rounded-full bg-amber-500/15 ring-1 ring-amber-400/30 text-amber-300">
                  <UserRound className="w-3 h-3" />מזוהה
                </span>
              )}
              <span className="text-[0.62rem] font-bold text-ink-3 tnum">{DATE_FMT(c.created_date)}</span>
              {c.reply ? (
                <span className="mr-auto inline-flex items-center gap-1 text-[0.62rem] font-black text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />נענתה
                </span>
              ) : (
                <span className="mr-auto inline-flex items-center gap-1 text-[0.62rem] font-black text-ink-3">
                  <Clock className="w-3 h-3" />ממתינה
                </span>
              )}
            </div>
            <p className="text-slate-300 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{c.body}</p>
            {c.reply && (
              <div className="mt-2.5 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/25 p-3">
                <span className="flex items-center gap-1 text-amber-300 text-[0.65rem] font-black mb-1">
                  <ShieldCheck className="w-3 h-3" />תגובת המנהל
                </span>
                <p className="text-amber-100 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{c.reply}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Player: send a complaint ─────────────────────────────────────────────────
function ComplaintForm() {
  const [anonymous, setAnonymous] = useState(false);
  const [body, setBody] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const queryClient = useQueryClient();

  const submit = async () => {
    const clean = body.trim();
    if (clean.length < 3) { toast.error('כתוב לפחות כמה מילים 🙂'); return; }
    setSending(true);
    try {
      const token = newToken();
      const { error } = await supabase.rpc('submit_complaint', {
        p_body: clean,
        p_anonymous: anonymous,
        p_token: token,
      });
      if (error) throw error;
      saveToken(token); // lets this device see the admin's reply, even anonymously

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
      queryClient.invalidateQueries({ queryKey: ['my-complaints'] });
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
            ? 'ההודעה הועברה באופן אנונימי לחלוטין — הזהות שלך לא נשמרה. אם המנהל יגיב, התגובה תופיע כאן תחת "הפניות שלי" (במכשיר הזה).'
            : 'ההודעה הועברה למנהל עם השם שלך. אם יגיב — תקבל התראה והתגובה תופיע כאן.'}
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

      <MyComplaints />
    </div>
  );
}

// ── Admin: inbox with replies ────────────────────────────────────────────────
function ComplaintsInbox() {
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState(null);
  const [replyingId, setReplyingId] = useState(null); // complaint being replied to
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  const { data: complaints = [], isLoading } = useQuery({
    queryKey: ['complaints'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_complaints');
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  // For targeting the reply push at an identified sender (player_id → email).
  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
    staleTime: 300_000,
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

  const sendReply = async (c) => {
    const clean = replyText.trim();
    if (!clean) { toast.error('כתוב תגובה קודם'); return; }
    setSendingReply(true);
    try {
      const { error } = await supabase.rpc('admin_reply_complaint', { p_id: c.id, p_reply: clean });
      if (error) throw error;

      // Identified sender → personal push. Anonymous → no one to push; they'll
      // see the reply in-app on the device they sent from.
      if (c.player_id) {
        const email = players.find((p) => p.id === c.player_id)?.email;
        if (email && email !== 'unknown') {
          try {
            await callApi('/api/send-notification', {
              targetEmail: email,
              title: 'תיבת התלונות 📬',
              body: 'המנהל הגיב לפנייה שלך — היכנס לצפות בתגובה',
              url: '/ComplaintsBox',
            });
          } catch (e) { console.warn('[reply push]', e); }
        }
      }

      queryClient.invalidateQueries({ queryKey: ['complaints'] });
      setReplyingId(null);
      setReplyText('');
      toast.success(c.player_id ? 'התגובה נשלחה + פוש לשחקן 🔔' : 'התגובה נשמרה — תוצג לשולח האנונימי בכניסתו');
    } catch (e) {
      toast.error('שליחת התגובה נכשלה', { description: e.message });
    } finally {
      setSendingReply(false);
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
              {c.reply && (
                <span className="inline-flex items-center gap-1 text-[0.62rem] font-black text-emerald-400">
                  <CheckCircle2 className="w-3 h-3" />נענתה
                </span>
              )}
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

            {/* Existing reply */}
            {c.reply && replyingId !== c.id && (
              <div className="mt-2.5 rounded-xl bg-amber-500/10 ring-1 ring-amber-400/25 p-3">
                <span className="flex items-center gap-1 text-amber-300 text-[0.65rem] font-black mb-1">
                  <ShieldCheck className="w-3 h-3" />התגובה שלך
                </span>
                <p className="text-amber-100 text-sm font-medium leading-relaxed whitespace-pre-wrap break-words">{c.reply}</p>
              </div>
            )}

            {/* Reply composer */}
            {replyingId === c.id ? (
              <div className="mt-2.5 rounded-xl bg-slate-900/70 ring-1 ring-white/10 p-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value.slice(0, MAX_LEN))}
                  placeholder="כתוב את התגובה שלך..."
                  rows={3}
                  dir="rtl"
                  autoFocus
                  className="w-full bg-transparent text-white text-sm font-medium placeholder:text-white/25 outline-none resize-none leading-relaxed"
                />
                <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/5">
                  <button
                    onClick={() => sendReply(c)}
                    disabled={sendingReply || !replyText.trim()}
                    className="flex items-center gap-1.5 min-h-[38px] px-4 rounded-xl st-foil font-black text-xs active:scale-95 transition-transform disabled:opacity-40"
                  >
                    {sendingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    שלח תגובה
                  </button>
                  <button
                    onClick={() => { setReplyingId(null); setReplyText(''); }}
                    className="min-h-[38px] px-3 rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-400 font-black text-xs active:scale-95 transition-transform"
                  >
                    ביטול
                  </button>
                  <span className="mr-auto text-[0.6rem] font-bold text-ink-3">
                    {c.player_id ? '🔔 יישלח פוש לשחקן' : '🕶 יוצג לשולח בכניסתו'}
                  </span>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setReplyingId(c.id); setReplyText(c.reply || ''); }}
                className="mt-2.5 flex items-center gap-1.5 min-h-[36px] px-3 rounded-xl bg-slate-800/70 ring-1 ring-white/10 text-slate-300 font-black text-xs hover:text-amber-300 active:scale-95 transition-all"
              >
                <Reply className="w-3.5 h-3.5" />
                {c.reply ? 'ערוך תגובה' : 'השב'}
              </button>
            )}
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
