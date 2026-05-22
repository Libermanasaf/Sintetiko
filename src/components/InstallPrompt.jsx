import React, { useState, useEffect } from 'react';
import { Download, X, Share, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const DISMISS_KEY = 'sintetiko_install_prompt_dismissed';

function isIos() {
  const ua = window.navigator.userAgent;
  return (
    /iphone|ipad|ipod/i.test(ua) ||
    (ua.includes('Macintosh') && 'ontouchend' in document)
  );
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [show, setShow] = useState(false);
  const [iosHelp, setIosHelp] = useState(false);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === '1') return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShow(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => setShow(false);
    window.addEventListener('appinstalled', installedHandler);

    // iOS Safari never fires beforeinstallprompt — show manual guidance
    if (isIos()) setShow(true);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (outcome === 'accepted') {
        toast.success('האפליקציה מותקנת');
        setShow(false);
      }
    } else if (isIos()) {
      setIosHelp(true);
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
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-[calc(64px+env(safe-area-inset-bottom))] left-0 right-0 mx-4 z-40 bg-slate-800/95 border border-amber-500/40 rounded-2xl p-3.5 shadow-lg"
          dir="rtl"
        >
          {iosHelp ? (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm mb-1">התקנה לאייפון</p>
                <p className="text-slate-300 text-xs leading-relaxed">
                  הקש על כפתור השיתוף{' '}
                  <Share className="w-3.5 h-3.5 inline-block text-sky-400 -mt-0.5" /> בתחתית
                  Safari, ואז בחר{' '}
                  <span className="font-bold text-white">
                    "הוסף למסך הבית"
                  </span>{' '}
                  <Plus className="w-3.5 h-3.5 inline-block text-white -mt-0.5" />
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors shrink-0"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Download className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm">התקן את האפליקציה</p>
                <p className="text-slate-400 text-xs leading-snug">
                  גישה מהירה ישירות ממסך הבית של הטלפון
                </p>
              </div>
              <button
                onClick={handleInstall}
                className="bg-amber-500 hover:bg-amber-400 text-slate-900 text-sm font-bold px-4 py-2 rounded-xl transition-colors shrink-0"
              >
                התקן
              </button>
              <button
                onClick={handleDismiss}
                className="text-slate-400 hover:text-white transition-colors shrink-0"
                aria-label="סגור"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
