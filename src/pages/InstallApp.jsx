import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download, Share2, Plus, CheckCircle2, Smartphone, Chrome, MoreVertical, ArrowUpFromLine } from 'lucide-react';
import { PageHeader } from '@/components/ui/lux';

function isIosBrowser() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
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

function PlatformCard({ platform, steps, lang }) {
  const isIos = platform === 'ios';
  return (
    <div className="rounded-2xl bg-slate-900/70 ring-1 ring-white/8 overflow-hidden">
      <div className={`flex items-center gap-2.5 px-4 py-3 border-b border-white/8 ${isIos ? 'bg-sky-500/8' : 'bg-emerald-500/8'}`}>
        {isIos
          ? <Smartphone className={`w-4 h-4 ${isIos ? 'text-sky-400' : 'text-emerald-400'}`} strokeWidth={2.2} />
          : <Chrome className="w-4 h-4 text-emerald-400" strokeWidth={2.2} />
        }
        <span className={`font-black text-sm ${isIos ? 'text-sky-300' : 'text-emerald-300'}`}>
          {isIos ? (lang === 'he' ? 'אייפון / Safari' : 'iPhone / Safari') : (lang === 'he' ? 'אנדרואיד / Chrome' : 'Android / Chrome')}
        </span>
      </div>
      <div className="p-4 space-y-3">
        {steps.map((step, i) => (
          <StepRow key={i} num={i + 1} icon={step.icon}>{step.text}</StepRow>
        ))}
      </div>
    </div>
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
  { icon: CheckCircle2, text: 'Tap "Add" — the app will appear on your home screen' },
];
const STEPS_ANDROID_EN = [
  { icon: Chrome, text: 'Open this page in Chrome' },
  { icon: MoreVertical, text: 'Tap the three dots ⋮ in the top-right corner' },
  { icon: Plus, text: 'Select "Add to Home Screen" or "Install App"' },
  { icon: CheckCircle2, text: 'Confirm — the app installs instantly' },
];

export default function InstallApp() {
  const [installed, setInstalled] = useState(isStandalonePwa);
  const [prompted, setPrompted] = useState(false);
  const ios = isIosBrowser();

  useEffect(() => {
    if (installed || ios) return;
    const p = window.__pwaPrompt;
    if (!p || prompted) return;
    setPrompted(true);
    (async () => {
      p.prompt();
      const { outcome } = await p.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    })();
  }, [installed, ios, prompted]);

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader icon={Download} title="הורדת האפליקציה" subtitle="שמור את האפליקציה על מסך הבית שלך" accent="amber" />

      <div className="p-4 space-y-6">

        {installed ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative rounded-2xl p-px bg-gradient-to-br from-emerald-400/50 via-slate-700/20 to-slate-800/10"
          >
            <div className="rounded-[15px] bg-slate-900/90 p-6 flex flex-col items-center text-center gap-3">
              <div className="grid place-items-center w-14 h-14 rounded-full bg-emerald-500/20 ring-1 ring-emerald-400/40">
                <CheckCircle2 className="w-7 h-7 text-emerald-400" strokeWidth={2.2} />
              </div>
              <p className="text-white font-black text-lg">האפליקציה מותקנת!</p>
              <p className="text-slate-400 text-sm font-bold">
                סינטיקו כבר זמינה על מסך הבית שלך
              </p>
            </div>
          </motion.div>
        ) : !ios && window.__pwaPrompt ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-2xl p-px bg-gradient-to-br from-amber-400/40 via-slate-700/20 to-slate-800/10"
          >
            <div className="rounded-[15px] bg-slate-900/90 p-4 flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-amber-500/15 ring-1 ring-amber-400/30 shrink-0">
                <Download className="w-5 h-5 text-amber-400" strokeWidth={2.3} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm">מתבצעת התקנה…</p>
                <p className="text-slate-400 text-xs font-bold">אשר בחלון שנפתח</p>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* ── הוראות בעברית ── */}
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-gradient-to-l from-transparent to-amber-400/40" />
            <span className="text-amber-300 font-black text-sm tracking-wide">הוראות בעברית</span>
            <span className="h-px flex-1 bg-gradient-to-r from-transparent to-amber-400/40" />
          </div>
          <PlatformCard platform="ios" steps={STEPS_IOS_HE} lang="he" />
          <PlatformCard platform="android" steps={STEPS_ANDROID_HE} lang="he" />
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
    </div>
  );
}
