import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Shuffle, History, BarChart3, Star } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const adminNavItems = [
  { label: 'בית', path: '/', icon: Home },
  { label: 'פודיום', path: '/Podium', icon: Trophy },
  { label: 'מחזור', path: '/CreateRound', icon: Shuffle },
  { label: 'היסטוריה', path: '/GameHistory', icon: History },
  { label: 'סטטיסטיקות', path: '/Statistics', icon: BarChart3 },
];

const playerNavItems = [
  { label: 'פודיום', path: '/Podium', icon: Trophy },
  { label: 'היסטוריה', path: '/GameHistory', icon: History },
  { label: 'סטטיסטיקות', path: '/Statistics', icon: BarChart3 },
  { label: 'דירוג', path: '/RatePlayers', icon: Star },
];

export default function BottomNav({ hidden = false }) {
  const location = useLocation();
  const { role, loginMode } = useAuth();
  const isAdmin = role === 'admin';
  const showPlayerMenu = loginMode ? loginMode === 'player' : !isAdmin;
  const visibleItems = showPlayerMenu ? playerNavItems : adminNavItems;

  if (hidden) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-stadium/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
      aria-label="ניווט תחתון"
    >
      <div className="st-rule absolute top-0 inset-x-0" />
      <div className="flex items-stretch justify-around px-1.5">
        {visibleItems.map(({ label, path, icon: Icon }) => {
          const isActive =
            location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 py-2.5 px-2 flex-1 min-h-[60px] transition-colors duration-150 ${
                isActive ? 'text-amber-300' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3px] rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
              )}
              <span
                className={`grid place-items-center w-9 h-9 rounded-xl transition-all duration-150 ${
                  isActive
                    ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/5 ring-1 ring-amber-400/30'
                    : ''
                }`}
              >
                <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.6 : 2} />
              </span>
              <span className={`text-[0.62rem] font-black leading-none ${isActive ? 'text-amber-300' : 'text-slate-500'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
