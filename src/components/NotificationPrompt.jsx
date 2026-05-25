import React, { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { pushSupported, subscribeToPush } from '@/lib/push';
import { toast } from 'sonner';

const DISMISS_KEY = 'sintetiko_push_prompt_dismissed';

export default function NotificationPrompt() {
  const { user, role } = useAuth();
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!role) return;
    if (!pushSupported()) return;
    if (Notification.permission === 'granted') return;
    if (Notification.permission === 'denied') return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;
    // Small delay so the page renders first
    const t = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(t);
  }, [role]);

  const handleEnable = async () => {
    setBusy(true);
    const ok = await subscribeToPush(user?.email);
    setBusy(false);
    setShow(false);
    if (ok) {
      toast.success('התראות הופעלו', { description: 'תקבל הודעה כשהרכבים מתפרסמים' });
    } else {
      toast.error('לא ניתן להפעיל התראות', {
        description: 'ניתן לאפשר התראות דרך הגדרות הדפדפן',
      });
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, '1');
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="mx-4 mt-4 bg-emerald-900/90 border border-emerald-600/40 rounded-2xl p-3.5 flex items-center gap-3 shadow-lg"
          dir="rtl"
        >
          <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
            <Bell className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">הפעל התראות</p>
            <p className="text-emerald-200/70 text-xs leading-snug">
              קבל הודעה ברגע שהרכבים מתפרסמים
            </p>
          </div>
          <button
            onClick={handleEnable}
            disabled={busy}
            className="bg-emerald-500 hover:bg-emerald-400 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors disabled:opacity-50 shrink-0"
          >
            {busy ? '...' : 'אפשר'}
          </button>
          <button
            onClick={handleDismiss}
            className="text-emerald-300/60 hover:text-white transition-colors shrink-0"
            aria-label="סגור"
          >
            <X className="w-5 h-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
