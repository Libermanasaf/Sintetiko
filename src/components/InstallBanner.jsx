import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

function isStandalonePwa() {
  return window.matchMedia('(display-mode: standalone)').matches || !!window.navigator.standalone;
}

export default function InstallBanner() {
  const [installed, setInstalled] = useState(isStandalonePwa);

  useEffect(() => {
    // Keep the prompt globally available for the install page
    const onPrompt = (e) => { e.preventDefault(); window.__pwaPrompt = e; };
    const onInstalled = () => setInstalled(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, type: 'spring', damping: 22, stiffness: 260 }}
      className="mb-4"
    >
      <Link
        to={createPageUrl('InstallApp')}
        className="w-full flex items-center justify-center gap-2.5 min-h-[48px] rounded-2xl bg-gradient-to-l from-amber-500/18 to-amber-400/8 ring-1 ring-amber-400/35 text-amber-300 font-black text-sm active:scale-[0.98] transition-transform touch-manipulation"
      >
        <Download className="w-4 h-4" strokeWidth={2.4} />
        הורד את האפליקציה לנייד
      </Link>
    </motion.div>
  );
}
