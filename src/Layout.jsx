import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/navigation/Sidebar';
import BottomNav from '@/components/navigation/BottomNav';
import InstallPrompt from '@/components/InstallPrompt';
import { useAuth } from '@/lib/AuthContext';
import LandingPage from '@/components/auth/LandingPage';
import { registerServiceWorker, ensureSubscribed } from '@/lib/push';
import NotificationGate from '@/components/NotificationGate';
import { recordPageVisit } from '@/lib/loginActivity';
import OfflineBanner from '@/components/OfflineBanner';

// Compact crest monogram for the header — gold ring + pitch core
function HeaderCrest() {
  return (
    <svg viewBox="0 0 48 48" className="w-9 h-9" aria-hidden="true">
      <defs>
        <linearGradient id="hdrGold" x1="6" y1="4" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fde9b8" />
          <stop offset="48%" stopColor="#e0a92e" />
          <stop offset="100%" stopColor="#9a6a16" />
        </linearGradient>
        <radialGradient id="hdrCore" cx="42%" cy="34%" r="72%">
          <stop offset="0%" stopColor="#15573f" />
          <stop offset="100%" stopColor="#06110d" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="22" fill="url(#hdrGold)" />
      <circle cx="24" cy="24" r="18.5" fill="url(#hdrCore)" />
      <circle cx="24" cy="24" r="18.5" fill="none" stroke="#f3d27e" strokeWidth="0.8" strokeOpacity="0.5" />
      <g transform="translate(24 24)" stroke="url(#hdrGold)" strokeWidth="1.8" strokeLinecap="round" fill="none">
        <line x1="0" y1="-4" x2="0" y2="-11" />
        <line x1="3.8" y1="-1.2" x2="10.5" y2="-3.4" />
        <line x1="2.35" y1="3.2" x2="6.5" y2="9" />
        <line x1="-2.35" y1="3.2" x2="-6.5" y2="9" />
        <line x1="-3.8" y1="-1.2" x2="-10.5" y2="-3.4" />
      </g>
      <path
        d="M24,18.6 L29.13,22.33 L27.17,28.36 L20.83,28.36 L18.87,22.33 Z"
        fill="url(#hdrGold)"
      />
    </svg>
  );
}

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, user, isInitializing } = useAuth();

  useEffect(() => {
    registerServiceWorker();
  }, []);

  useEffect(() => {
    if (role && user) {
      ensureSubscribed(user.email);
    }
  }, [role, user]);

  // Track which areas each logged-in user visits (atomic per-user counter).
  useEffect(() => {
    if (user && currentPageName) {
      recordPageVisit(`/${currentPageName}`);
    }
  }, [currentPageName, user]);

  if (isInitializing) {
    return <div className="min-h-screen st-stage" aria-hidden="true" />;
  }

  // The password-reset page must render for a not-yet-signed-in user arriving
  // from the email link (they have only a temporary recovery session, no role).
  const isResetRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/ResetPassword');

  if (!role && !isResetRoute) {
    return <LandingPage />;
  }

  return (
    <div dir="rtl" className="relative min-h-screen st-stage overflow-hidden">
      <OfflineBanner />
      <a href="#main-content" className="st-skip-link">דלג לתוכן הראשי</a>

      {/* Stadium texture — mowed-pitch stripes + fine grain */}
      <div
        className="fixed inset-0 z-0 pointer-events-none st-pitch-lines st-grain"
        aria-hidden="true"
      />

      {/* Header — safe-area via inline style (guaranteed on iOS PWA) */}
      <header
        role="banner"
        className="fixed top-0 inset-x-0 z-30 bg-stadium/85 backdrop-blur-xl"
        style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      >
        <div className="st-rule absolute bottom-0 inset-x-0" />
        <div className="flex items-center justify-between px-4 h-16">
          <button
            onClick={() => setSidebarOpen(true)}
            aria-label="פתח תפריט ניווט"
            className="grid place-items-center w-11 h-11 rounded-xl bg-slate-900/80 ring-1 ring-amber-400/25 text-amber-300 active:scale-95 transition-transform touch-manipulation"
          >
            <Menu className="w-5 h-5" strokeWidth={2.4} />
          </button>

          <div className="flex items-center gap-2.5">
            <HeaderCrest />
            <div className="leading-none text-right">
              <h1 className="st-gold-text text-lg font-black tracking-tight">
                סינתטיקו
              </h1>
              <span className="block text-[0.58rem] font-bold tracking-[0.32em] text-ink-3 mt-0.5">
                חולון
              </span>
            </div>
          </div>

          <div className="w-11" aria-hidden="true" />
        </div>
      </header>

      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main
        id="main-content"
        className="relative z-10 min-h-screen"
        style={{
          paddingTop: 'calc(4rem + env(safe-area-inset-top, 0px))',
          paddingBottom: 'calc(68px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {children}
      </main>
      <NotificationGate />

      <InstallPrompt />

      <BottomNav hidden={sidebarOpen} />
    </div>
  );
}
