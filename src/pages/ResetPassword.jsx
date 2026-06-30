import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import { motion } from 'framer-motion';
import { KeyRound, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';

// Landing target of the password-reset email link. Supabase puts a recovery
// session in place when the user arrives here; updatePassword() then sets the
// new password. If they arrive without a recovery session (e.g. opened the page
// directly), we say the link is invalid/expired.
export default function ResetPassword() {
  const { updatePassword } = useAuth();
  const [ready, setReady] = useState(false);   // a recovery session exists
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) { setChecking(false); return; }
    // The email link carries the recovery token in the URL hash; supabase-js
    // exchanges it for a session and fires a PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' || session) { setReady(true); setChecking(false); }
    });
    // Also check an already-established session (in case the event fired first).
    supabase.auth.getSession().then(({ data }) => {
      if (data?.session) setReady(true);
      setChecking(false);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) { setError('הסיסמה חייבת להכיל לפחות 6 תווים'); return; }
    if (password !== confirm) { setError('הסיסמאות אינן תואמות'); return; }
    setBusy(true);
    const { error: err } = await updatePassword(password);
    setBusy(false);
    if (err) { setError(err.message || 'עדכון הסיסמה נכשל'); return; }
    setDone(true);
    setTimeout(() => { window.location.href = '/'; }, 2500);
  };

  return (
    <div className="min-h-screen st-stage flex items-center justify-center px-5 py-8 relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm st-card p-6 sm:p-8 relative z-10"
      >
        <div className="grid place-items-center w-14 h-14 mx-auto mb-4 rounded-2xl st-foil shadow-[0_8px_24px_-8px_rgba(250,204,21,0.6)]">
          <KeyRound className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-black text-white text-center mb-1">איפוס סיסמה</h1>

        {checking ? (
          <div className="py-10 grid place-items-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : done ? (
          <div className="py-6 text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <p className="text-white font-black">הסיסמה עודכנה!</p>
            <p className="text-ink-3 text-sm">מעבירים אותך לכניסה…</p>
          </div>
        ) : !ready ? (
          <div className="py-6 text-center space-y-3">
            <p className="text-rose-300 font-bold">הקישור אינו תקין או שפג תוקפו</p>
            <p className="text-ink-3 text-sm">בקש איפוס סיסמה מחדש ממסך ההתחברות.</p>
            <a href="/" className="inline-block mt-2 text-amber-300 font-black text-sm">חזרה לכניסה</a>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 mt-4">
            <p className="text-ink-3 text-sm text-center">בחר סיסמה חדשה לחשבונך.</p>
            <div className="relative">
              <label className="text-[0.78rem] font-bold text-ink-2 mr-1">סיסמה חדשה</label>
              <input
                type={show ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 min-h-[48px] px-3 pl-10 rounded-xl bg-slate-900/70 ring-1 ring-white/8 text-slate-200 font-medium focus:ring-amber-400/40 focus:outline-none"
                dir="ltr"
              />
              <button type="button" onClick={() => setShow(s => !s)}
                className="absolute left-2 bottom-2 grid place-items-center w-8 h-8 text-slate-400" aria-label="הצג סיסמה">
                {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <div>
              <label className="text-[0.78rem] font-bold text-ink-2 mr-1">אימות סיסמה</label>
              <input
                type={show ? 'text' : 'password'} value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full mt-1 min-h-[48px] px-3 rounded-xl bg-slate-900/70 ring-1 ring-white/8 text-slate-200 font-medium focus:ring-amber-400/40 focus:outline-none"
                dir="ltr"
              />
            </div>
            {error && <p className="text-rose-300 text-sm font-bold text-center">{error}</p>}
            <button type="submit" disabled={busy || !password || !confirm}
              className="w-full min-h-[50px] rounded-2xl st-foil font-black active:scale-[0.99] transition-transform disabled:opacity-50 flex items-center justify-center gap-2">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              עדכן סיסמה
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
