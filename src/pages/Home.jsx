import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, Users, Shuffle, History, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';

export default function Home() {
  const { isDark, setIsDark } = useTheme();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-5 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center"
      >
        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm text-sm font-medium"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>מצב בהיר</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-500" />
                <span>מצב כהה</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Football icon decoration */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="mb-8"
        >
          <div className="w-24 h-24 mx-auto bg-gradient-to-br from-emerald-800 to-emerald-950 rounded-full flex items-center justify-center shadow-2xl">
            <span className="text-4xl">⚽</span>
          </div>
        </motion.div>

        {/* Main title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-700 to-emerald-950 dark:from-emerald-400 dark:to-emerald-600 mb-4 leading-tight"
        >
          סינתטיקו
        </motion.h1>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-500 to-amber-600 mb-8"
        >
          חולון
        </motion.h2>

        {/* Decorative line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="w-32 h-1.5 bg-gradient-to-r from-emerald-600 via-amber-500 to-emerald-600 mx-auto rounded-full"
        />

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.5 }}
          className="mt-8 text-slate-500 dark:text-slate-400 text-lg"
        >
          ניהול קבוצה חכם ופשוט
        </motion.p>

        {/* Quick Access Menu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="mt-10 grid grid-cols-2 gap-3 w-full max-w-sm mx-auto"
        >
          <Link
            to={createPageUrl('Podium')}
            className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 shadow-lg active:scale-95 transition-all touch-manipulation"
          >
            <Trophy className="w-7 h-7 text-white mb-2" />
            <h3 className="text-white font-bold text-base leading-tight">הפודיום</h3>
            <p className="text-white/80 text-xs mt-0.5">המובילים</p>
          </Link>

          {isAdmin && (
            <Link
              to={createPageUrl('Players')}
              className="bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-2xl p-5 shadow-lg active:scale-95 transition-all touch-manipulation"
            >
              <Users className="w-7 h-7 text-white mb-2" />
              <h3 className="text-white font-bold text-base leading-tight">סגל שחקנים</h3>
              <p className="text-white/80 text-xs mt-0.5">ניהול שחקנים</p>
            </Link>
          )}

          {isAdmin && (
            <Link
              to={createPageUrl('CreateRound')}
              className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 shadow-lg active:scale-95 transition-all touch-manipulation"
            >
              <Shuffle className="w-7 h-7 text-white mb-2" />
              <h3 className="text-white font-bold text-base leading-tight">יצירת מחזור</h3>
              <p className="text-white/80 text-xs mt-0.5">הגרלת קבוצות</p>
            </Link>
          )}

          <Link
            to={createPageUrl('GameHistory')}
            className="bg-gradient-to-br from-slate-600 to-slate-700 rounded-2xl p-5 shadow-lg active:scale-95 transition-all touch-manipulation"
          >
            <History className="w-7 h-7 text-white mb-2" />
            <h3 className="text-white font-bold text-base leading-tight">יומן משחקים</h3>
            <p className="text-white/80 text-xs mt-0.5">היסטוריה</p>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
