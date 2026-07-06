import React, { useState, useEffect } from 'react'; // v2
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { X, LogOut, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { menuItems, adminGroups } from '@/lib/navConfig';

const GROUPS_STORAGE_KEY = 'sb_admin_groups';

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

  // Admin view only: collapse grouped items under section headers. Player view
  // stays a flat list. Open/closed state survives reloads via localStorage.
  const grouped = !showPlayerView;
  const coreItems = grouped ? visibleItems.filter((i) => !i.group) : visibleItems;
  const [openGroups, setOpenGroups] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(GROUPS_STORAGE_KEY) || 'null');
      if (saved && typeof saved === 'object') return saved;
    } catch { /* corrupt storage — fall back to defaults */ }
    return { club: true, money: false, system: false };
  });

  const toggleGroup = (key) => {
    setOpenGroups((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      try { localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(next)); } catch { /* private mode */ }
      return next;
    });
  };

  // When the drawer opens, make sure the current page's section is expanded so
  // the highlighted item is never hidden inside a closed group.
  useEffect(() => {
    if (!isOpen || !grouped) return;
    const active = visibleItems.find(
      (i) => i.group && location.pathname === createPageUrl(i.page)
    );
    if (active && !openGroups[active.group]) {
      setOpenGroups((prev) => ({ ...prev, [active.group]: true }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const renderNavItem = (item) => {
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
  };

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
              {coreItems.map(renderNavItem)}

              {grouped && adminGroups.map((g) => {
                const items = visibleItems.filter((i) => i.group === g.key);
                if (items.length === 0) return null;
                const open = !!openGroups[g.key];
                const GIcon = g.icon;
                const hasActive = items.some(
                  (i) => location.pathname === createPageUrl(i.page)
                );

                return (
                  <div key={g.key}>
                    <button
                      type="button"
                      onClick={() => toggleGroup(g.key)}
                      aria-expanded={open}
                      className="w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl ring-1 ring-transparent active:bg-white/5 transition-colors duration-150"
                    >
                      <span className="grid place-items-center w-9 h-9 rounded-lg shrink-0 bg-slate-800/80 text-amber-300/80">
                        <GIcon className="w-[18px] h-[18px]" strokeWidth={2.2} />
                      </span>
                      <span className="flex-1 text-right text-[0.82rem] font-black tracking-wide text-amber-300/90">
                        {g.name}
                      </span>
                      {!open && hasActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)] shrink-0" />
                      )}
                      <span className="text-ink-3 text-[0.62rem] font-bold tnum shrink-0">{items.length}</span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${open ? '' : 'rotate-90'}`}
                        strokeWidth={2.4}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                          className="overflow-hidden"
                        >
                          <div className="space-y-1 pt-0.5 pb-1 mr-6 pr-1.5 border-r border-white/8">
                            {items.map(renderNavItem)}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
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
