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
import ClubCrest from '@/components/ClubCrest';

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
            <ClubCrest className="h-11 w-auto drop-shadow-[0_2px_6px_rgba(212,160,40,0.35)]" />
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
