import React from 'react';
import { motion } from 'framer-motion';
import { User, Shield } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

export default function LandingPage() {
  const { login } = useAuth();

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-amber-600/10 blur-3xl rounded-full" />
      </div>

      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-8"
        >
          <div className="w-28 h-28 mx-auto bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(16,185,129,0.3)] border-4 border-slate-900">
            <span className="text-5xl">⚽</span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600 mb-3 tracking-tight">
            סינתטיקו
          </h1>
          <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-600 mb-4">
            חולון
          </h2>
          <p className="text-slate-400 text-lg">
            ברוכים הבאים למערכת ניהול הקבוצה
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full space-y-4"
        >
          {/* Player Login */}
          <button
            onClick={() => login('player')}
            className="w-full flex items-center gap-4 bg-slate-800/80 backdrop-blur-sm border border-emerald-500/30 p-5 rounded-2xl hover:bg-slate-800 hover:border-emerald-500 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all group text-right"
          >
            <div className="w-14 h-14 bg-emerald-500/10 rounded-xl flex items-center justify-center group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all">
              <User className="w-7 h-7 text-emerald-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-0.5">כדורגלן פעיל בסינתטיקו</h3>
              <p className="text-slate-400 text-sm">כניסת שחקן סגל</p>
            </div>
          </button>

          {/* Admin Login */}
          <button
            onClick={() => login('admin')}
            className="w-full flex items-center gap-4 bg-slate-800/80 backdrop-blur-sm border border-amber-500/30 p-5 rounded-2xl hover:bg-slate-800 hover:border-amber-500 hover:shadow-[0_0_20px_rgba(245,158,11,0.15)] transition-all group text-right"
          >
            <div className="w-14 h-14 bg-amber-500/10 rounded-xl flex items-center justify-center group-hover:bg-amber-500/20 group-hover:scale-110 transition-all">
              <Shield className="w-7 h-7 text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-0.5">יו"ר ההתאחדות</h3>
              <p className="text-slate-400 text-sm">כניסת מנהל מערכת</p>
            </div>
          </button>
        </motion.div>
      </div>
    </div>
  );
}
