import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, Users, BarChart3, Shuffle, X, History, Trophy, CreditCard, Shield } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
  { name: 'עמוד הבית', page: 'Home', icon: Home },
  { name: 'הפודיום', page: 'Podium', icon: Trophy },
  { name: 'סגל שחקנים', page: 'Players', icon: Users },
  { name: 'סטטיסטיקות', page: 'Statistics', icon: BarChart3 },
  { name: 'יצירת מחזור', page: 'CreateRound', icon: Shuffle },
  { name: 'היסטוריית משחקים', page: 'GameHistory', icon: History },
  { name: 'תשלומים', page: 'Payments', icon: CreditCard },
  { name: 'גיבוי ושחזור', page: 'Backup', icon: Shield },
];

export default function Sidebar({ isOpen, onClose, currentPage }) {
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
            className="fixed top-0 right-0 h-full w-72 bg-gradient-to-b from-emerald-900 to-emerald-950 z-50 shadow-2xl"
          >
            <div className="p-6">
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
                {menuItems.map((item) => {
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
            
            <div className="absolute bottom-8 left-0 right-0 px-6">
              <div className="text-center text-white/40 text-sm">
                ⚽ בהצלחה במשחק!
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}