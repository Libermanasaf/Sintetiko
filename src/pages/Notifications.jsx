import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, BellOff, CheckCircle2, Settings, Smartphone, RefreshCw, Zap, Shield, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/lux';
import { pushSupported, subscribeToPush } from '@/lib/push';
import { useAuth } from '@/lib/AuthContext';

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
function isAndroid() {
  return /Android/.test(navigator.userAgent);
}
function isPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function readPermission() {
  return typeof Notification !== 'undefined' ? Notification.permission : 'denied';
}

const BENEFITS = [
  { icon: Zap,      text: 'עדכון מיידי כשמחזור חדש נפתח' },
  { icon: Calendar, text: 'תזכורת ביום המשחק' },
  { icon: Shield,   text: 'הודעות מהמנהל ישירות לטלפון' },
];

export default function Notifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState(readPermission);
  const [loading, setLoading] = useState(false);
  const [justUnblocked, setJustUnblocked] = useState(false);
  const supported = pushSupported();

  // Re-check when user returns from OS settings
  useEffect(() => {
    const onVisible = () => {
      const current = readPermission();
      if (current !== permission) {
        setPermission(current);
        if (current === 'default') setJustUnblocked(true);
        if (current === 'granted') toast.success('התראות הופעלו!');
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [permission]);

  const handleEnable = useCallback(async () => {
    if (!supported) return;
    setLoading(true);
    setJustUnblocked(false);
    try {
      const ok = await subscribeToPush(user?.email);
      const newPerm = readPermission();
      setPermission(newPerm);
      if (ok) toast.success('התראות הופעלו בהצלחה!');
      else if (newPerm === 'denied') toast.error('הגישה נחסמה', { description: 'שנה את ההגדרות ידנית' });
    } finally {
      setLoading(false);
    }
  }, [supported, user]);

  const handleRecheck = useCallback(() => {
    const current = readPermission();
    setPermission(current);
    if (current === 'default') { setJustUnblocked(true); toast.info('לחץ "הפעל התראות"'); }
    else if (current === 'granted') handleEnable();
    else toast.error('עדיין חסום', { description: 'שנה בהגדרות תחילה' });
  }, [handleEnable]);

  const ios = isIOS();
  const android = isAndroid();
  const pwa = isPWA();

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader icon={Bell} title="התראות" subtitle="נהל את התראות האפליקציה" accent="amber" />

      <div className="p-4 max-w-lg mx-auto space-y-4">

        {/* ── DEFAULT: full priming screen ── */}
        {permission === 'default' && (
          <motion.div
            key="default"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Hero card */}
            <div className="rounded-2xl bg-gradient-to-br from-amber-900/40 to-slate-900/60 ring-1 ring-amber-400/25 p-6 text-center">
              <div className="grid place-items-center w-20 h-20 rounded-2xl bg-amber-500/15 ring-2 ring-amber-400/30 mx-auto mb-4 relative">
                <Bell className="w-9 h-9 text-amber-300" />
                {/* Pulse ring */}
                <span className="absolute inset-0 rounded-2xl ring-2 ring-amber-400/40 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
              <h2 className="text-white font-black text-xl leading-tight mb-1">הפעל התראות</h2>
              <p className="text-slate-400 text-sm font-medium leading-snug">
                לא תפספס שום מחזור — קבל עדכון ישירות לטלפון
              </p>
            </div>

            {/* Benefits */}
            <div className="rounded-2xl bg-slate-800/60 ring-1 ring-white/8 divide-y divide-white/6">
              {BENEFITS.map(({ icon: Icon, text }, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="grid place-items-center w-8 h-8 rounded-lg bg-amber-500/15 ring-1 ring-amber-400/20 shrink-0">
                    <Icon className="w-4 h-4 text-amber-400" />
                  </div>
                  <span className="text-slate-200 text-sm font-bold">{text}</span>
                </div>
              ))}
            </div>

            {justUnblocked && (
              <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-xl bg-emerald-900/40 ring-1 ring-emerald-500/30 px-4 py-3 flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-emerald-200 text-xs font-bold">ההגדרות שונו! לחץ "הפעל התראות"</p>
              </motion.div>
            )}

            {/* Big CTA */}
            <button
              onClick={handleEnable}
              disabled={loading || !supported}
              className="w-full flex items-center justify-center gap-2.5 min-h-[60px] rounded-xl st-foil font-black text-base shadow-[0_8px_28px_-8px_rgba(212,160,40,0.65)] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
            >
              {loading
                ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Bell className="w-5 h-5" />
              }
              {loading ? 'מפעיל...' : 'הפעל התראות'}
            </button>

            <p className="text-center text-[0.65rem] text-slate-500 font-bold">
              ניתן לבטל בכל עת מהגדרות המכשיר
            </p>
          </motion.div>
        )}

        {/* ── GRANTED ── */}
        {permission === 'granted' && (
          <motion.div
            key="granted"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="rounded-2xl bg-emerald-900/30 ring-1 ring-emerald-500/25 p-6 text-center">
              <div className="grid place-items-center w-16 h-16 rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/30 mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-emerald-300 font-black text-lg">התראות פעילות</h2>
              <p className="text-slate-400 text-xs font-medium mt-1">
                אתה מקבל עדכונים על מחזורים חדשים
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/60 ring-1 ring-white/8 p-4 flex items-start gap-3">
              <Bell className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm">הכל מוגדר</p>
                <p className="text-slate-400 text-xs font-bold mt-0.5 leading-snug">
                  תקבל התראה ברגע שמחזור חדש יפורסם או כשהמנהל ישלח עדכון.
                </p>
              </div>
              <button
                onClick={handleEnable}
                disabled={loading}
                title="חדש מנוי"
                className="grid place-items-center w-9 h-9 rounded-lg bg-slate-700/60 ring-1 ring-white/8 text-slate-400 active:scale-95 transition-transform shrink-0"
              >
                {loading
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <RefreshCw className="w-4 h-4" />
                }
              </button>
            </div>
          </motion.div>
        )}

        {/* ── DENIED ── */}
        {permission === 'denied' && (
          <motion.div
            key="denied"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Status */}
            <div className="rounded-2xl bg-rose-900/25 ring-1 ring-rose-500/20 p-5 flex items-center gap-4">
              <div className="grid place-items-center w-14 h-14 rounded-2xl bg-rose-500/15 ring-1 ring-rose-500/20 shrink-0">
                <BellOff className="w-7 h-7 text-rose-400" />
              </div>
              <div>
                <p className="text-rose-300 font-black text-base">התראות חסומות</p>
                <p className="text-slate-400 text-xs font-bold mt-0.5 leading-snug">
                  חסמת את ההרשאה — יש לאפשר ידנית בהגדרות
                </p>
              </div>
            </div>

            {/* Instructions */}
            <div className="rounded-2xl bg-slate-800/60 ring-1 ring-white/8 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-amber-400 shrink-0" />
                <p className="text-white font-black text-sm">
                  {ios ? 'כיצד לאפשר ב-iPhone / iPad' : android ? 'כיצד לאפשר ב-Android' : 'כיצד לאפשר בדפדפן'}
                </p>
              </div>
              <ol className="space-y-2.5">
                {(ios
                  ? [
                      'פתח את אפליקציית ״הגדרות״',
                      'גלול מטה ובחר ״Safari״',
                      'לחץ על ״הגדרות לאתרים״ ← ״התראות״',
                      'מצא את sintetiko.vercel.app ושנה ל-״אפשר״',
                      'חזור לאפליקציה ולחץ ״בדוק שוב״',
                    ]
                  : android && pwa
                    ? [
                        'פתח את Chrome (הדפדפן הרגיל, לא האפליקציה)',
                        'הקלד בסרגל הכתובת: sintetiko.vercel.app',
                        'לחץ על סמל המנעול ← ״הרשאות״ ← ״התראות״',
                        'שנה ל-״אפשר״',
                        'חזור לאפליקציה ולחץ ״בדוק שוב״',
                      ]
                  : android
                    ? [
                        'לחץ על סמל המנעול בסרגל הכתובת',
                        'בחר ״הרשאות אתר״',
                        'לחץ על ״התראות״ ושנה ל-״אפשר״',
                        'חזור ולחץ ״בדוק שוב״',
                      ]
                    : [
                        'לחץ על סמל המנעול בשורת הכתובת',
                        'בחר ״הגדרות אתר״ ← ״התראות״',
                        'שנה ל-״אפשר״',
                        'חזור ולחץ ״בדוק שוב״',
                      ]
                ).map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm">
                    <span className="grid place-items-center w-5 h-5 rounded-full bg-amber-500/20 ring-1 ring-amber-400/30 text-amber-300 font-black text-[0.62rem] shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-slate-300 font-medium leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            <button
              onClick={handleRecheck}
              className="w-full flex items-center justify-center gap-2.5 min-h-[52px] rounded-xl bg-slate-800/80 ring-1 ring-white/10 font-black text-sm text-slate-200 active:scale-[0.98] hover:bg-slate-700/80 transition-all touch-manipulation"
            >
              <RefreshCw className="w-4 h-4 text-amber-400" />
              בדוק שוב לאחר שינוי הגדרות
            </button>

            <div className="rounded-xl bg-amber-500/8 ring-1 ring-amber-400/20 px-4 py-3 flex items-center gap-2.5">
              <Smartphone className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-amber-200/80 text-xs font-bold leading-snug">
                לאחר שינוי ב״הגדרות״, חזור לכאן ולחץ ״בדוק שוב״
              </p>
            </div>
          </motion.div>
        )}

        {!supported && (
          <div className="rounded-xl bg-slate-800/60 ring-1 ring-white/8 px-4 py-3 text-slate-400 text-xs font-bold text-center">
            הדפדפן שלך אינו תומך בהתראות
          </div>
        )}
      </div>
    </div>
  );
}
