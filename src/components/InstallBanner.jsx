import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Share, X } from 'lucide-react';

function isIosBrowser() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (ua.includes('Macintosh') && 'ontouchend' in document);
}
function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;
}

export default function InstallBanner() {
  const [prompt, setPrompt] = useState(() => window.__pwaPrompt || null);
  const [installed, setInstalled] = useState(isStandalonePwa);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const ios = isIosBrowser();

  useEffect(() => {
    if (installed) return;
    const onPrompt = (e) => { e.preventDefault(); window.__pwaPrompt = e; setPrompt(e); };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [installed]);

  if (installed) return null;
  if (!prompt && !ios) return null;

  const handleClick = async () => {
    if (prompt) {
      prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') setInstalled(true);
    } else {
      setShowIosHelp(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, type: 'spring', damping: 22, stiffness: 260 }}
      className="mb-4"
    >
      <AnimatePresence mode="wait">
        {showIosHelp ? (
          <motion.div
            key="ios"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="relative rounded-2xl p-px bg-gradient-to-br from-amber-400/40 via-slate-700/20 to-slate-800/10"
          >
            <div className="rounded-[15px] bg-slate-900/90 px-4 py-3.5 flex items-start gap-3">
              <div className="grid place-items-center w-9 h-9 rounded-xl bg-amber-500/15 ring-1 ring-amber-400/30 shrink-0 mt-0.5">
                <Share className="w-4 h-4 text-amber-400" strokeWidth={2.3} />
              </div>
              <div className="flex-1 min-w-0 text-right">
                <p className="text-white font-black text-sm mb-0.5">התקנה לאייפון</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  לחץ על{' '}
                  <Share className="w-3 h-3 inline-block text-sky-400 -mt-0.5" />{' '}
                  בתחתית Safari ← בחר{' '}
                  <span className="font-bold text-white">״הוסף למסך הבית״</span>
                </p>
              </div>
              <button
                onClick={() => setShowIosHelp(false)}
                className="text-slate-500 active:text-white transition-colors shrink-0 touch-manipulation"
                aria-label="סגור"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.button
            key="btn"
            onClick={handleClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full flex items-center justify-center gap-2.5 min-h-[48px] rounded-2xl bg-gradient-to-l from-amber-500/18 to-amber-400/8 ring-1 ring-amber-400/35 text-amber-300 font-black text-sm active:scale-[0.98] transition-transform touch-manipulation"
          >
            <Download className="w-4 h-4" strokeWidth={2.4} />
            הורד את האפליקציה לנייד
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
