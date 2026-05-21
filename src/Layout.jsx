import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/navigation/Sidebar';
import BottomNav from '@/components/navigation/BottomNav';
import NotificationPrompt from '@/components/NotificationPrompt';
import InstallPrompt from '@/components/InstallPrompt';
import { useAuth } from '@/lib/AuthContext';
import LandingPage from '@/components/auth/LandingPage';
import { registerServiceWorker, ensureSubscribed } from '@/lib/push';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, user, isInitializing } = useAuth();

  // Register the service worker once on mount
  useEffect(() => {
    registerServiceWorker();
  }, []);

  // Keep the push subscription fresh once the user is known and has granted permission
  useEffect(() => {
    if (role && user) {
      ensureSubscribed(user.email);
    }
  }, [role, user]);

  if (isInitializing) {
    return null; // or a loading spinner
  }

  if (!role) {
    return <LandingPage />;
  }

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 transition-colors duration-300 relative overflow-hidden">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Heebo:wght@300;400;500;600;700;800;900&display=swap');
        
        * {
          font-family: 'Heebo', sans-serif;
        }
        
        :root {
          --color-primary: #1B4D3E;
          --color-gold: #D4AF37;
        }

        @keyframes glow-pulse-1 {
          0%, 100% { opacity: 0.3; transform: translate(0, 0) scale(1); }
          50% { opacity: 0.6; transform: translate(15px, -10px) scale(1.15); }
        }
        @keyframes glow-pulse-2 {
          0%, 100% { opacity: 0.25; transform: translate(0, 0) scale(1); }
          50% { opacity: 0.5; transform: translate(-20px, 15px) scale(1.1); }
        }
        @keyframes glow-pulse-3 {
          0%, 100% { opacity: 0.2; transform: translate(0, 0) scale(1); }
          50% { opacity: 0.45; transform: translate(10px, 10px) scale(1.2); }
        }
        .glow-orb-1 { animation: glow-pulse-1 6s ease-in-out infinite; }
        .glow-orb-2 { animation: glow-pulse-2 8s ease-in-out infinite; }
        .glow-orb-3 { animation: glow-pulse-3 7s ease-in-out infinite; }
      `}</style>

      {/* Ambient glow orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Top-right emerald glow */}
        <div className="glow-orb-1 absolute -top-32 -right-32 w-[400px] h-[400px] bg-emerald-500/20 dark:bg-emerald-500/10 rounded-full blur-[100px]" />
        {/* Bottom-left amber glow */}
        <div className="glow-orb-2 absolute -bottom-40 -left-40 w-[450px] h-[450px] bg-amber-500/15 dark:bg-amber-500/8 rounded-full blur-[120px]" />
        {/* Center-top subtle teal glow */}
        <div className="glow-orb-3 absolute top-1/3 left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-teal-400/10 dark:bg-teal-400/5 rounded-full blur-[100px]" />
        {/* Bottom-right small emerald accent */}
        <div className="glow-orb-1 absolute bottom-20 -right-20 w-[250px] h-[250px] bg-emerald-600/10 dark:bg-emerald-600/5 rounded-full blur-[80px]" />
      </div>
      
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="w-10" />
          <h1 className="text-lg font-bold text-emerald-900 dark:text-emerald-400">סינתטיקו חולון</h1>
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl bg-emerald-900 dark:bg-emerald-700 text-white hover:bg-emerald-800 dark:hover:bg-emerald-600 transition-colors shadow-lg"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>
      
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPage={currentPageName}
      />
      
      <main className="relative z-10 pt-16 min-h-screen pb-[env(safe-area-inset-bottom)]">
        <InstallPrompt />
        <NotificationPrompt />
        {children}
      </main>

      <BottomNav />
    </div>
  );
}