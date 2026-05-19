import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Users, Shuffle, History } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';

const navItems = [
  { label: 'בית', path: '/', icon: Home },
  { label: 'פודיום', path: '/Podium', icon: Trophy },
  { label: 'מחזור', path: '/CreateRound', icon: Shuffle, adminOnly: true },
  { label: 'היסטוריה', path: '/GameHistory', icon: History },
  { label: 'עוד', path: '/Players', icon: Users, adminOnly: true },
];

export default function BottomNav() {
  const location = useLocation();
  const { role } = useAuth();
  const isAdmin = role === 'admin';

  const visibleItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 safe-area-pb">
      <div className="flex items-stretch justify-around px-1">
        {visibleItems.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path));
          return (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center justify-center gap-1 py-3 px-3 flex-1 min-h-[60px] transition-all duration-200 ${
                isActive ? 'text-emerald-400' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${isActive ? 'bg-emerald-500/20' : ''}`}>
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-emerald-400' : 'text-slate-500'}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}