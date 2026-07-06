import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Trophy, Shuffle, History, BarChart3, Star, Swords, ClipboardCheck } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Round } from '@/api/entities';

const adminNavItems = [
  { label: 'בית', path: '/', icon: Home },
  { label: 'פודיום', path: '/Podium', icon: Trophy },
  { label: 'מחזור', path: '/CreateRound', icon: Shuffle },
  { label: 'היסטוריה', path: '/GameHistory', icon: History },
  { label: 'סטטיסטיקות', path: '/Statistics', icon: BarChart3 },
];

const playerNavItems = [
  { label: 'משחק', path: '/MatchDay', icon: Swords, liveKey: true },
  { label: 'פודיום', path: '/Podium', icon: Trophy },
  { label: 'היסטוריה', path: '/GameHistory', icon: History },
  { label: 'סטטיסטיקות', path: '/Statistics', icon: BarChart3 },
  { label: 'דירוג', path: '/RatePlayers', icon: Star },
];

// Restricted players keep only the personal area + signup.
const restrictedNavItems = [
  { label: 'בית', path: '/PlayerHome', icon: Home },
  { label: 'רישום', path: '/SignupPage', icon: ClipboardCheck },
];

export default function BottomNav({ hidden = false }) {
  const location = useLocation();
  const { role, loginMode, isRestricted } = useAuth();
  const isAdmin = role === 'admin';
  const showPlayerMenu = loginMode ? loginMode === 'player' : !isAdmin;
  const visibleItems = showPlayerMenu
    ? (isRestricted ? restrictedNavItems : playerNavItems)
    : adminNavItems;

  // Shared cache — same key as MatchDay/PlayerHome, no extra fetch
  const { data: activeRound } = useQuery({
    queryKey: ['latest-round'],
    queryFn: async () => {
      const rounds = await Round.list('-created_date', 5); // only recent: active round is always newest
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3);
      cutoff.setHours(0, 0, 0, 0);
      return rounds.find(r =>
        Array.isArray(r.openingTeams) && r.openingTeams.length >= 2 &&
        r.winningTeam == null &&
        !r.victoryPhoto &&
        !r.is_closed &&
        new Date(r.date) >= cutoff &&
        r.is_published === true
      ) || null;
    },
    enabled: showPlayerMenu && !isRestricted,
    // BottomNav is mounted on every screen, so this poll runs the whole time the
    // app is open — the single biggest idle-month egress term. A published round
    // arrives via push + invalidateQueries, so 5 min is a safe fallback cadence.
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60_000,
  });

  if (hidden) return null;

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 bg-stadium/95 backdrop-blur-xl"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="ניווט תחתון"
    >
      <div className="st-rule absolute top-0 inset-x-0" />
      <div className="flex items-stretch justify-around px-1.5">
        {visibleItems.map(({ label, path, icon: Icon, liveKey }) => {
          const isActive =
            location.pathname === path ||
            (path !== '/' && location.pathname.startsWith(path));
          const hasLive = liveKey && !!activeRound;
          return (
            <Link
              key={path}
              to={path}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 py-2.5 px-2 flex-1 min-h-[60px] transition-colors duration-150 ${
                isActive ? 'text-amber-300' : hasLive ? 'text-emerald-400' : 'text-slate-500 active:text-slate-300'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-9 h-[3px] rounded-full bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.7)]" />
              )}
              <span className="relative">
                <span
                  className={`grid place-items-center w-9 h-9 rounded-xl transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-br from-amber-500/25 to-amber-600/5 ring-1 ring-amber-400/30'
                      : hasLive
                        ? 'bg-emerald-500/15 ring-1 ring-emerald-500/30'
                        : ''
                  }`}
                >
                  <Icon className="w-[20px] h-[20px]" strokeWidth={isActive ? 2.6 : 2} />
                </span>
                {hasLive && !isActive && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                  </span>
                )}
              </span>
              <span className={`text-[0.62rem] font-black leading-none ${
                isActive ? 'text-amber-300' : hasLive ? 'text-emerald-400' : 'text-slate-500'
              }`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
