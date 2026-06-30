import React, { useState, useEffect } from 'react';
import { Bell, X, BellRing, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { pushSupported, subscribeToPush } from '@/lib/push';
import { toast } from 'sonner';

// Per-session snooze: "אחר כך" hides it for THIS session only, so it returns on
// the next app open (unlike a permanent dismiss). We never nag inside the same
// session once they've snoozed or acted.
const SNOOZE_KEY = 'sintetiko_push_snoozed_session';

export default function NotificationGate() {
  const { user, role } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (!role) return;                                  // not signed in
    if (!pushSupported()) return;                        // browser can't do push
    if (Notification.permission === 'granted') return;   // already subscribed
    if (sessionStorage.getItem(SNOOZE_KEY) === '1') return; // snoozed this session
    setDenied(Notification.permission === 'denied');
    const t = setTimeout(() => setShow(true), 1500);     // let the page render first
    return () => clearTimeout(t);
  }, [role]);

  const enable = async () => {
    setBusy(true);
    const ok = await subscribeToPush(user?.email);
    setBusy(false);
    if (ok) {
      setShow(false);
      toast.success('התראות הופעלו! 🔔', { description: 'תקבל הודעה כשהרכבים מתפרסמים' });
    } else {
      // Browser denied (or PWA-not-installed on iOS). Switch to the help state
      // instead of closing, so they understand why and how to fix it.
      setDenied(true);
      setBusy(false);
    }
  };

  const snooze = () => {
    sessionStorage.setItem(SNOOZE_KEY, '1'); // returns next app open
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: 24, scale: 0.96, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }}
            className="w-full max-w-sm st-card p-6 text-center relative"
            style={{ paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
          >
            <button onClick={snooze} aria-label="אחר כך"
              className="absolute top-3 left-3 grid place-items-center w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 active:scale-95">
              <X className="w-4 h-4" />
            </button>

            <motion.div
              animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
              transition={{ duration: 1, repeat: Infinity, repeatDelay: 1.5 }}
              className="grid place-items-center w-16 h-16 mx-auto mb-4 rounded-2xl st-foil shadow-[0_8px_28px_-8px_rgba(250,204,21,0.7)]"
            >
              <BellRing className="w-7 h-7" />
            </motion.div>

            {denied ? (
              <>
                <h2 className="font-black text-white text-lg mb-2">ההתראות חסומות</h2>
                <p className="text-ink-2 text-sm leading-relaxed mb-5">
                  חסמת את ההתראות בעבר. כדי להפעיל — היכנס להגדרות הדפדפן/הטלפון
                  עבור סינתטיקו, ואפשר "התראות". באייפון: ודא שהוספת את האפליקציה למסך הבית.
                </p>
                <button onClick={snooze}
                  className="w-full min-h-[48px] rounded-2xl bg-slate-800 ring-1 ring-white/10 text-slate-200 font-black active:scale-[0.99] transition-transform">
                  הבנתי
                </button>
              </>
            ) : (
              <>
                <h2 className="font-black text-white text-lg mb-2">אל תפספס את ההרכבים! 🔔</h2>
                <p className="text-ink-2 text-sm leading-relaxed mb-5">
                  הפעל התראות כדי לקבל הודעה ברגע שהרכב מתפרסם, כשמאשרים אותך מרשימת
                  ההמתנה, ועל כל עדכון חשוב — לפני כולם.
                </p>
                <button onClick={enable} disabled={busy}
                  className="w-full min-h-[52px] rounded-2xl st-foil font-black active:scale-[0.99] transition-transform disabled:opacity-50 flex items-center justify-center gap-2 mb-2.5 shadow-[0_10px_28px_-10px_rgba(250,204,21,0.7)]">
                  {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Bell className="w-5 h-5" />}
                  אפשר התראות
                </button>
                <button onClick={snooze}
                  className="w-full min-h-[44px] rounded-xl text-ink-3 font-bold text-sm hover:text-white transition-colors">
                  אחר כך
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
