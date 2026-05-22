import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Users, BarChart3, Shuffle, X, History, Trophy, CreditCard, Shield, LogOut, UserCheck, Star } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

const menuItems = [
  { name: 'עמוד הבית', page: 'Home', icon: Home },
  { name: 'עמוד הבית', page: 'PlayerHome', icon: Home, playerVisible: true },
  { name: 'הפודיום', page: 'Podium', icon: Trophy, playerVisible: true },
  { name: 'סגל שחקנים', page: 'Players', icon: Users, adminOnly: true },
  { name: 'סטטיסטיקות', page: 'Statistics', icon: BarChart3, playerVisible: true },
  { name: 'יצירת מחזור', page: 'CreateRound', icon: Shuffle, adminOnly: true },
  { name: 'היסטוריית משחקים', page: 'GameHistory', icon: History, playerVisible: true },
  { name: 'דרג שחקנים', page: 'RatePlayers', icon: Star, playerVisible: true },
  { name: 'תשלומים', page: 'Payments', icon: CreditCard, adminOnly: true },
  { name: 'אישור משתמשים', page: 'UserApprovals', icon: UserCheck, adminOnly: true },
  { name: 'גיבוי ושחזור', page: 'Backup', icon: Shield, adminOnly: true },
];

export default function Sidebar({ isOpen, onClose, currentPage }) {
  const { role, logout } = useAuth();
  const isAdmin = role === 'admin';
  const visibleItems = isAdmin
    ? menuItems.filter(item => !item.adminOnly || isAdmin)
    : menuItems.filter(item => item.playerVisible);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-950 z-50 shadow-2xl flex flex-col overflow-hidden"
          >
            {/* gold edge + ambient glow */}
            <div className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-transparent via-amber-400/60 to-transparent" />
            <div className="absolute -top-20 -right-10 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-32 -left-10 w-40 h-40 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative p-6 flex-1 overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-2 text-white/60 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mt-8 mb-9 text-center">
                <div className="text-3xl mb-2">⚽</div>
                <h2 className="text-2xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-l from-amber-400 via-amber-100 to-amber-400">
                  סינתטיקו חולון
                </h2>
                <div className="w-20 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent mx-auto mt-3" />
              </div>

              <nav className="space-y-1.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.page;

                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={onClose}
                      className={`relative flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-l from-amber-500/20 to-amber-500/5 text-white ring-1 ring-amber-400/30 shadow-lg'
                          : 'text-white/65 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-full bg-amber-400" />
                      )}
                      <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : ''}`} />
                      <span className={`${isActive ? 'font-bold' : 'font-medium'}`}>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="relative p-6 border-t border-white/10">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/15 text-rose-300 hover:text-rose-200 transition-colors border border-rose-500/25"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-bold">התנתקות</span>
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}