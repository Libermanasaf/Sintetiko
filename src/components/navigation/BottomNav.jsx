import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Users, Shuffle, History, BarChart3, Star } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const adminNavItems = [
  { label: 'בית', path: '/', icon: Home },
  { label: 'פודיום', path: '/Podium', icon: Trophy },
  { label: 'מחזור', path: '/CreateRound', icon: Shuffle },
  { label: 'היסטוריה', path: '/GameHistory', icon: History },
  { label: 'עוד', path: '/Players', icon: Users },
];

const playerNavItems = [
  { label: 'פודיום', path: '/Podium', icon: Trophy },
  { label: 'היסטוריה', path: '/GameHistory', icon: History },
  { label: 'סטטיסטיקות', path: '/Statistics', icon: BarChart3 },
  { label: 'דירוג', path: '/RatePlayers', icon: Star },
];

export default function BottomNav({ hidden = false }) {
  const location = useLocation();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const visibleItems = isAdmin ? adminNavItems : playerNavItems;

  if (hidden) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]">
      {/* gold accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />
      <div className="flex items-stretch justify-around px-1">
        {visibleItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 px-3 flex-1 min-h-[60px] transition-all duration-200 ${
                isActive ? 'text-amber-400' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
              )}
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/10 ring-1 ring-amber-400/30' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-bold leading-none ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}