import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Plus, CheckCircle2, Smartphone, Chrome, MoreVertical, ArrowUpFromLine, Sparkles, X } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/lux';

function isIosBrowser() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
}
function isAndroidBrowser() {
  return /android/i.test(navigator.userAgent);
}
function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;
}

function StepRow({ num, icon: Icon, children }) {
  return (
    <div className="flex items-start gap-3">
      <div className="grid place-items-center w-7 h-7 rounded-full bg-amber-500/20 ring-1 ring-amber-400/40 shrink-0 mt-0.5">
        <span className="text-amber-300 font-black text-xs tnum">{num}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          {Icon && <Icon className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2.2} />}
          <span className="text-slate-200 text-sm font-bold leading-snug">{children}</span>
        </div>
      </div>
    </div>
  );
}

function PlatformCard({ platform, steps, lang, highlighted, innerRef }) {
  const isIos = platform === 'ios';
  return (
    <motion.div
      ref={innerRef}
      animate={highlighted ? { scale: [1, 1.025, 1], boxShadow: ['0 0 0 0 rgba(251,191,36,0)', '0 0 0 6px rgba(251,191,36,0.35)', '0 0 0 0 rgba(251,191,36,0)'] } : {}}
      transition={{ duration: 1.1 }}
      className={`rounded-2xl bg-slate-900/70 ring-1 ${highlighted ? 'ring-amber-400/60' : 'ring-white/8'} overflow-hidden`}
    >
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-white/8 ${isIos ? 'bg-sky-500/8' : 'bg-emerald-500/8'}`}>
        {isIos
          ? <Smartphone className="w-4 h-4 text-sky-400" strokeWidth={2.2} />
          : <Chrome className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />
        }
        <span className={`font-black text-sm ${isIos ? 'text-sky-300' : 'text-emerald-300'}`}>
          {isIos
            ? (lang === 'he' ? 'אייפון / Safari' : 'iPhone / Safari')
            : (lang === 'he' ? 'אנדרואיד / Chrome' : 'Android / Chrome')}
        </span>
        {highlighted && (
          <span className="ml-auto text-[0.6rem] font-black px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300">
            {lang === 'he' ? 'המכשיר שלך' : 'YOUR DEVICE'}
          </span>
        )}
      </div>
      <div className="p-4 space-y-3">
        {steps.map((step, i) => (
          <StepRow key={i} num={i + 1} icon={step.icon}>{step.text}</StepRow>
        ))}
      </div>
    </motion.div>
  );
}

const STEPS_IOS_HE = [
  { icon: Smartphone, text: 'פתח עמוד זה בדפדפן Safari (לא בכרום)' },
  { icon: ArrowUpFromLine, text: 'לחץ על כפתור השיתוף ↑ בתחתית Safari' },
  { icon: Plus, text: 'גלול ובחר "הוסף למסך הבית"' },
  { icon: CheckCircle2, text: 'לחץ "הוסף" — האפליקציה תופיע על מסך הבית' },
];
const STEPS_ANDROID_HE = [
  { icon: Chrome, text: 'פתח עמוד זה בדפדפן Chrome' },
  { icon: MoreVertical, text: 'לחץ על שלוש הנקודות ⋮ בפינה הימנית' },
  { icon: Plus, text: 'בחר "הוסף למסך הבית" או "התקן אפליקציה"' },
  { icon: CheckCircle2, text: 'אשר — האפליקציה תותקן מיד' },
];
const STEPS_IOS_EN = [
  { icon: Smartphone, text: 'Open this page in Safari (not Chrome)' },
  { icon: ArrowUpFromLine, text: 'Tap the Share button ↑ at the bottom of Safari' },
  { icon: Plus, text: 'Scroll down and tap "Add to Home Screen"' },
  { icon: CheckCircle2, text: 'Tap "Add" — the app appears on your home screen' },
];
const STEPS_ANDROID_EN = [
  { icon: Chrome, text: 'Open this page in Chrome' },
  { icon: MoreVertical, text: 'Tap the three dots ⋮ in the top-right corner' },
  { icon: Plus, text: 'Select "Add to Home Screen" or "Install App"' },
  { icon: CheckCircle2, text: 'Confirm — the app installs instantly' },
];

export default function InstallApp() {
  const [installed, setInstalled] = useState(isStandalonePwa);
  const [highlight, setHighlight] = useState(null); // 'ios' | 'android' | null
  const [chooserOpen, setChooserOpen] = useState(false);
  const ios = isIosBrowser();
  const android = isAndroidBrowser();
  const iosRef = useRef(null);
  const androidRef = useRef(null);

  // Keep prompt freshly available even if banner mounted earlier
  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); window.__pwaPrompt = e; };
    const onInstalled = () => { setInstalled(true); toast.success('האפליקציה הותקנה בהצלחה!'); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const flashHighlight = (which) => {
    setHighlight(which);
    setTimeout(() => setHighlight(null), 1600);
  };

  const handleInstallClick = () => {
    if (installed) {
      toast.success('האפליקציה כבר מותקנת');
      return;
    }
    setChooserOpen(true);
  };

  const handleChoose = async (which) => {
    setChooserOpen(false);

    if (which === 'android') {
      const p = window.__pwaPrompt;
      if (p) {
        try {
          p.prompt();
          const { outcome } = await p.userChoice;
          if (outcome === 'accepted') {
            setInstalled(true);
            toast.success('האפליקציה הותקנה!');
          } else {
            toast('ההתקנה בוטלה');
          }
          window.__pwaPrompt = null;
          return;
        } catch (err) {
          console.warn('install prompt failed', err);
        }
      }
      // Fallback: show Android instructions
      setTimeout(() => {
        androidRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        flashHighlight('android');
      }, 100);
      if (!android) {
        toast('פתח את הדף בכרום באנדרואיד', { description: 'או עקוב אחר ההוראות למטה' });
      }
      return;
    }

    // iOS path — always manual via Safari Share menu
    setTimeout(() => {
      iosRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      flashHighlight('ios');
    }, 100);
    if (!ios) {
      toast('פתח את הדף בסאפארי באייפון', { description: 'עקוב אחר ההוראות שמופיעות למטה' });
    } else {
      toast('עקוב אחר ההוראות שמופיעות למטה');
    }
  };

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader icon={Download} title="הורדת האפליקציה" subtitle="שמור את סינתטיקו על מסך הבית של הטלפון" accent="amber" />

      <div className="p-4 space-y-6">

        {/* ── Big action card ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-2xl p-px bg-gradient-to-br from-amber-400/60 via-amber-500/20 to-slate-800/10"
        >
          <div className="rounded-[15px] bg-gradient-to-b from-slate-900/95 to-slate-950 p-5">
            {installed ? (
              <div className="flex flex-col items-center text-center gap-3">
                <div className="grid place-items-center w-14 h-14 rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
                  <CheckCircle2 className="w-7 h-7 text-emerald-400" strokeWidth={2.2} />
                </div>
                <p className="text-white font-black text-lg">האפליקציה מותקנת!</p>
                <p className="text-slate-400 text-sm font-bold">
                  סינתטיקו זמינה על מסך הבית שלך
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center text-center gap-2 mb-4">
                  <div className="grid place-items-center w-14 h-14 rounded-2xl st-foil shadow-[0_8px_22px_-6px_rgba(212,160,40,0.6)]">
                    <Download className="w-7 h-7" strokeWidth={2.3} />
                  </div>
                  <p className="text-white font-black text-lg">התקן את האפליקציה</p>
                  <p className="text-slate-400 text-xs font-bold leading-relaxed max-w-xs">
                    גישה מהירה במגע אחד, התראות פוש, וחוויית אפליקציה מלאה
                  </p>
                </div>

                <button
                  onClick={handleInstallClick}
                  className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-2xl st-foil font-black text-base shadow-[0_8px_22px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] transition-transform touch-manipulation"
                >
                  <Sparkles className="w-5 h-5" strokeWidth={2.4} />
                  התקן עכשיו
                </button>

                <p className="text-center text-ink-3 text-[0.65rem] font-bold mt-3">
                  לחץ ובחר את סוג המכשיר שלך
                </p>
              </>
            )}
          </div>
        </motion.div>

        {/* ── הוראות בעברית ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/40" />
            <span className="text-amber-300 font-black text-sm tracking-wide">הוראות בעברית</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/40" />
          </div>
          <PlatformCard platform="ios" steps={STEPS_IOS_HE} lang="he" highlighted={highlight === 'ios'} innerRef={iosRef} />
          <PlatformCard platform="android" steps={STEPS_ANDROID_HE} lang="he" highlighted={highlight === 'android'} innerRef={androidRef} />
        </section>

        {/* ── Instructions in English ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-sky-400/40" />
            <span className="text-sky-300 font-black text-sm tracking-wide">Instructions in English</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-sky-400/40" />
          </div>
          <div dir="ltr" className="space-y-3">
            <PlatformCard platform="ios" steps={STEPS_IOS_EN} lang="en" />
            <PlatformCard platform="android" steps={STEPS_ANDROID_EN} lang="en" />
          </div>
        </section>

      </div>

      {/* ── Device chooser modal ── rendered via portal to escape parent contexts */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {chooserOpen && (
            <motion.div
              dir="rtl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
              onClick={() => setChooserOpen(false)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', damping: 24, stiffness: 260 }}
                className="w-full max-w-sm"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="בחר סוג מכשיר"
              >
                <div className="relative rounded-2xl p-px bg-gradient-to-br from-amber-400/60 via-slate-700/30 to-slate-800/10">
                  <div className="rounded-[15px] bg-gradient-to-b from-slate-900 to-slate-950 p-5">
                    <button
                      onClick={() => setChooserOpen(false)}
                      aria-label="סגור"
                      className="absolute top-3 left-3 grid place-items-center w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 active:scale-95 transition-transform touch-manipulation"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="text-center mb-5">
                      <p className="st-gold-text font-black text-lg">איזה מכשיר יש לך?</p>
                      <p className="text-slate-400 text-xs font-bold mt-1">בחר כדי להמשיך בהתקנה</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleChoose('ios')}
                        className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl bg-slate-800/80 ring-1 ring-sky-500/30 active:scale-[0.97] transition-transform touch-manipulation"
                      >
                        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-sky-500/15 ring-1 ring-sky-400/40">
                          <Smartphone className="w-6 h-6 text-sky-300" strokeWidth={2.2} />
                        </div>
                        <span className="text-sky-300 font-black text-base">אייפון</span>
                        <span className="text-ink-3 text-[0.6rem] font-bold">iPhone / iPad</span>
                      </button>

                      <button
                        onClick={() => handleChoose('android')}
                        className="flex flex-col items-center justify-center gap-2 py-5 rounded-xl bg-slate-800/80 ring-1 ring-emerald-500/30 active:scale-[0.97] transition-transform touch-manipulation"
                      >
                        <div className="grid place-items-center w-12 h-12 rounded-2xl bg-emerald-500/15 ring-1 ring-emerald-400/40">
                          <Chrome className="w-6 h-6 text-emerald-300" strokeWidth={2.2} />
                        </div>
                        <span className="text-emerald-300 font-black text-base">אנדרואיד</span>
                        <span className="text-ink-3 text-[0.6rem] font-bold">Android</span>
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
