import React from 'react';
import { motion } from 'framer-motion';

export default function PlayerHome() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">⚽</span>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white mb-2">אזור אישי בבנייה</h2>
        <p className="text-slate-500 max-w-sm mx-auto">
          עמוד זה יהיה זמין בהמשך ויכיל את כל המידע האישי שלך ככדורגלן פעיל בסינתטיקו.
        </p>
      </motion.div>
    </div>
  );
}
