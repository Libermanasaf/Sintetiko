import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Shield, UserPlus, Mail, ArrowRight, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function LandingPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useState('selection'); // 'selection', 'register', 'email-sent'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (role) => {
    login(role);
    navigate('/');
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network request
    setTimeout(() => {
      setIsLoading(false);
      setView('email-sent');
    }, 1500);
  };

  const handleSimulateActivation = () => {
    // Simulate clicking the email link and activating the account
    handleLogin('player');
  };

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 flex flex-col items-center justify-center p-6 relative overflow-hidden">
      
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/10 blur-3xl rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-amber-600/10 blur-3xl rounded-full" />
      </div>

      <div className="z-10 w-full max-w-sm flex flex-col items-center">
        <AnimatePresence mode="wait">
          {view === 'selection' && (
            <motion.div
              key="selection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="w-full flex flex-col items-center"
            >
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

              <div className="text-center mb-12">
                <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-emerald-400 to-emerald-600 mb-3 tracking-tight">
                  סינתטיקו
                </h1>
                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-400 to-amber-600 mb-4">
                  חולון
                </h2>
                <p className="text-slate-400 text-lg">
                  ברוכים הבאים למערכת ניהול הקבוצה
                </p>
              </div>

              <div className="w-full space-y-4">
                {/* Player Login */}
                <button
                  onClick={() => handleLogin('player')}
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
                  onClick={() => handleLogin('admin')}
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

                <div className="pt-6 mt-6 border-t border-slate-800 w-full">
                  <button
                    onClick={() => setView('register')}
                    className="w-full flex items-center justify-center gap-2 bg-transparent border border-slate-700 p-4 rounded-xl hover:bg-slate-800 hover:border-slate-600 transition-all text-slate-300"
                  >
                    <UserPlus className="w-5 h-5 text-slate-400" />
                    <span className="font-bold">עדיין לא רשום? רישום ככדורגלן פעיל</span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {view === 'register' && (
            <motion.div
              key="register"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex flex-col"
            >
              <button 
                onClick={() => setView('selection')}
                className="self-start mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ArrowRight className="w-5 h-5" />
                <span>חזרה למסך הראשי</span>
              </button>

              <div className="mb-8">
                <h2 className="text-3xl font-black text-white mb-2">הרשמת כדורגלן</h2>
                <p className="text-slate-400">הזן את פרטיך כדי להצטרף לסגל הקבוצה</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 ml-1">כתובת אימייל</label>
                  <div className="relative">
                    <Mail className="w-5 h-5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="email" 
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pr-10 pl-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="player@example.com"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-slate-300 ml-1">סיסמה</label>
                  <div className="relative">
                    <KeyRound className="w-5 h-5 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input 
                      type="password" 
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl py-3.5 pr-10 pl-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="••••••••"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isLoading || !email || !password}
                  className="w-full mt-6 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white font-bold py-4 rounded-xl hover:from-emerald-400 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>שולח...</span>
                    </div>
                  ) : (
                    "הרשם עכשיו"
                  )}
                </button>
              </form>
            </motion.div>
          )}

          {view === 'email-sent' && (
            <motion.div
              key="email-sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full flex flex-col items-center text-center bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-3xl p-8"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/30">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>
              
              <h2 className="text-2xl font-black text-white mb-3">בדוק את המייל שלך</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                שלחנו קישור הפעלה לכתובת <strong>{email}</strong>.
                <br />
                לחץ על הקישור במייל כדי להפעיל את החשבון ולהיכנס למערכת.
              </p>

              {/* Simulation Helper */}
              <div className="w-full pt-6 border-t border-slate-700 border-dashed">
                <p className="text-xs text-slate-500 mb-3">(סימולציה: לחץ כאן כדי לדמות לחיצה על הקישור שקיבלת במייל)</p>
                <button
                  onClick={handleSimulateActivation}
                  className="w-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 py-3 rounded-xl font-bold hover:bg-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                  <Mail className="w-4 h-4" />
                  הפעל חשבון והיכנס
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
