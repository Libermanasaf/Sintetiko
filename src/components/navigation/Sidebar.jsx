import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  Home, Users, BarChart3, Shuffle, X, History, Trophy,
  CreditCard, Shield, LogOut, UserCheck, Star,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';

const menuItems = [
  { name: 'עמוד הבית', page: 'Home',         icon: Home,      admin: true },
  { name: 'עמוד הבית', page: 'PlayerHome',   icon: Home,      player: true },
  { name: 'הפודיום',    page: 'Podium',       icon: Trophy,    admin: true, player: true },
  { name: 'סגל שחקנים', page: 'Players',      icon: Users,     admin: true },
  { name: 'סטטיסטיקות', page: 'Statistics',   icon: BarChart3, admin: true, player: true },
  { name: 'יצירת מחזור', page: 'CreateRound', icon: Shuffle,   admin: true },
  { name: 'היסטוריית משחקים', page: 'GameHistory', icon: History, admin: true, player: true },
  { name: 'דרג שחקנים', page: 'RatePlayers',  icon: Star,      admin: true, player: true },
  { name: 'תשלומים',    page: 'Payments',     icon: CreditCard, admin: true },
  { name: 'אישור משתמשים', page: 'UserApprovals', icon: UserCheck, admin: true },
  { name: 'גיבוי ושחזור', page: 'Backup',     icon: Shield,    admin: true },
];

function SidebarCrest() {
  return (
    <svg viewBox="0 0 56 56" className="w-12 h-12" aria-hidden="true">
      <defs>
        <linearGradient id="sbGold" x1="6" y1="4" x2="50" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde9b8" />
          <stop offset="48%" stopColor="#e0a92e" />
          <stop offset="100%" stopColor="#9a6a16" />
        </linearGradient>
        <radialGradient id="sbCore" cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#15573f" />
          <stop offset="100%" stopColor="#06110d" />
        </radialGradient>
      </defs>
      <circle cx="28" cy="28" r="26" fill="url(#sbGold)" />
      <circle cx="28" cy="28" r="22" fill="url(#sbCore)" />
      <circle cx="28" cy="28" r="22" fill="none" stroke="#f3d27e" strokeWidth="0.9" strokeOpacity="0.5" />
      <g transform="translate(28 28)" stroke="url(#sbGold)" strokeWidth="2.1" strokeLinecap="round" fill="none">
        <line x1="0" y1="-5" x2="0" y2="-13" />
        <line x1="4.5" y1="-1.5" x2="12.4" y2="-4" />
        <line x1="2.8" y1="3.8" x2="7.6" y2="10.5" />
        <line x1="-2.8" y1="3.8" x2="-7.6" y2="10.5" />
        <line x1="-4.5" y1="-1.5" x2="-12.4" y2="-4" />
      </g>
      <path d="M28,21.7 L34,26.06 L31.71,33.1 L24.29,33.1 L22,26.06 Z" fill="url(#sbGold)" />
    </svg>
  );
}

export default function Sidebar({ isOpen, onClose }) {
  const { role, loginMode, user, logout } = useAuth();
  const location = useLocation();
  const isAdmin = role === 'admin';
  const showPlayerView = loginMode ? loginMode === 'player' : role === 'player';
  const visibleItems = menuItems.filter((item) =>
    showPlayerView ? item.player : item.admin
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/65 z-40 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 240 }}
            className="fixed top-0 right-0 h-full w-[19rem] max-w-[86vw] z-50 flex flex-col overflow-hidden bg-stadium-2"
            role="dialog"
            aria-modal="true"
            aria-label="תפריט ניווט"
          >
            {/* gold inner edge + texture */}
            <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-transparent via-amber-400/60 to-transparent" />
            <div className="absolute inset-0 pointer-events-none st-pitch-lines" aria-hidden="true" />
            <div className="absolute -top-16 -right-10 w-44 h-44 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" aria-hidden="true" />

            {/* Brand header */}
            <div
              className="relative px-5 pb-5"
              style={{ paddingTop: 'calc(1.5rem + env(safe-area-inset-top, 0px))' }}
            >
              <button
                onClick={onClose}
                aria-label="סגור תפריט"
                className="absolute left-4 grid place-items-center w-9 h-9 rounded-lg bg-slate-900/70 ring-1 ring-white/10 text-slate-400 active:scale-95 transition-transform"
                style={{ top: 'calc(1rem + env(safe-area-inset-top, 0px))' }}
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex flex-col items-center text-center pt-2">
                <SidebarCrest />
                <h2 className="st-gold-text text-xl font-black tracking-tight mt-2.5">
                  סינתטיקו חולון
                </h2>
                <span className="text-[0.6rem] font-bold tracking-[0.3em] text-ink-3 uppercase mt-1">
                  מועדון הכדורגל
                </span>
              </div>

              <div className="st-rule mt-4" />
            </div>

            {/* Nav */}
            <nav
              className="relative flex-1 overflow-y-auto st-no-scrollbar px-3.5 pb-3 space-y-1"
              aria-label="ניווט ראשי"
            >
              {visibleItems.map((item) => {
                const Icon = item.icon;
                const to = createPageUrl(item.page);
                const isActive = location.pathname === to;

                return (
                  <Link
                    key={item.page}
                    to={to}
                    onClick={onClose}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative flex items-center gap-3.5 px-3.5 py-3 rounded-xl transition-colors duration-150 ${
                      isActive
                        ? 'bg-gradient-to-l from-amber-500/20 to-amber-500/5 ring-1 ring-amber-400/30'
                        : 'ring-1 ring-transparent active:bg-white/5'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-7 rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
                    )}
                    <span
                      className={`grid place-items-center w-9 h-9 rounded-lg shrink-0 ${
                        isActive
                          ? 'bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30'
                          : 'bg-slate-800/80 text-slate-400'
                      }`}
                    >
                      <Icon className="w-[18px] h-[18px]" strokeWidth={2.2} />
                    </span>
                    <span
                      className={`text-[0.95rem] ${
                        isActive ? 'text-white font-black' : 'text-slate-300 font-bold'
                      }`}
                    >
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer — user + logout */}
            <div
              className="relative px-4 pt-3 border-t border-white/10"
              style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
            >
              {user?.email && (
                <div className="flex items-center gap-2.5 mb-3 px-1">
                  <span className="grid place-items-center w-8 h-8 rounded-full st-foil text-xs font-black shrink-0">
                    {(user.email[0] || '?').toUpperCase()}
                  </span>
                  <div className="min-w-0">
                    <p className="text-slate-300 text-xs font-bold truncate" dir="ltr">
                      {user.email}
                    </p>
                    <p className="text-ink-3 text-[0.65rem] font-bold">
                      {isAdmin ? 'יו״ר המועדון' : 'שחקן'}
                    </p>
                  </div>
                </div>
              )}
              <button
                onClick={() => {
                  logout();
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2.5 min-h-[48px] rounded-xl bg-rose-500/10 hover:bg-rose-500/15 active:scale-[0.98] text-rose-300 transition-all border border-rose-500/25"
              >
                <LogOut className="w-5 h-5" />
                <span className="font-black">התנתקות</span>
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
