import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Users, BarChart3, Shuffle, X, History, Trophy, CreditCard, Shield, LogOut, UserCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

const menuItems = [
  { name: 'עמוד הבית', page: 'Home', icon: Home },
  { name: 'הפודיום', page: 'Podium', icon: Trophy },
  { name: 'סגל שחקנים', page: 'Players', icon: Users, adminOnly: true },
  { name: 'סטטיסטיקות', page: 'Statistics', icon: BarChart3 },
  { name: 'יצירת מחזור', page: 'CreateRound', icon: Shuffle, adminOnly: true },
  { name: 'היסטוריית משחקים', page: 'GameHistory', icon: History },
  { name: 'תשלומים', page: 'Payments', icon: CreditCard, adminOnly: true },
  { name: 'אישור משתמשים', page: 'UserApprovals', icon: UserCheck, adminOnly: true },
  { name: 'גיבוי ושחזור', page: 'Backup', icon: Shield, adminOnly: true },
];

export default function Sidebar({ isOpen, onClose, currentPage }) {
  const { role, logout } = useAuth();
  const isAdmin = role === 'admin';
  const visibleItems = menuItems.filter(item => !item.adminOnly || isAdmin);

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
            className="fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-emerald-900 to-emerald-950 z-50 shadow-2xl flex flex-col"
          >
            <div className="p-6 flex-1 overflow-y-auto">
              <button
                onClick={onClose}
                className="absolute top-4 left-4 p-2 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="mt-8 mb-10">
                <h2 className="text-2xl font-bold text-white text-center">
                  סינתטיקו חולון
                </h2>
                <div className="w-16 h-1 bg-amber-400 mx-auto mt-3 rounded-full" />
              </div>
              
              <nav className="space-y-2">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentPage === item.page;
                  
                  return (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={onClose}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-white/20 text-white shadow-lg'
                          : 'text-white/70 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-amber-400' : ''}`} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
            
            <div className="p-6 border-t border-white/10">
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-rose-300 hover:text-rose-200 transition-colors border border-rose-500/20"
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