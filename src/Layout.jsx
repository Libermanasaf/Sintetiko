import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/navigation/Sidebar';
import BottomNav from '@/components/navigation/BottomNav';
import { useAuth } from '@/lib/AuthContext';
import LandingPage from '@/components/auth/LandingPage';
import { motion } from 'framer-motion';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { role, isInitializing } = useAuth();

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
      `}</style>
      
      {/* Background Glowing Orbs */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.1, 0.2, 0.1] 
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] bg-emerald-500/20 dark:bg-emerald-600/20 blur-[100px] rounded-full" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.15, 0.1] 
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute -bottom-[20%] -left-[10%] w-[500px] h-[500px] bg-amber-500/15 dark:bg-amber-600/15 blur-[100px] rounded-full" 
        />
      </div>

      {/* Main App Container */}
      <div className="relative z-10 mx-auto max-w-lg min-h-screen shadow-[0_0_50px_rgba(16,185,129,0.1)] dark:shadow-[0_0_50px_rgba(16,185,129,0.05)] bg-white/40 dark:bg-slate-950/40 backdrop-blur-3xl flex flex-col">
        
        {/* Header */}
        <header className="sticky top-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-b border-emerald-500/10 dark:border-emerald-500/20 transition-colors duration-300 shadow-[0_4px_30px_rgba(16,185,129,0.05)]">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="w-10" />
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-l from-emerald-600 to-emerald-400 dark:from-emerald-400 dark:to-emerald-300 drop-shadow-sm">
              סינתטיקו חולון
            </h1>
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-800 to-emerald-950 text-white hover:from-emerald-700 hover:to-emerald-900 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] border border-emerald-500/30"
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
        
        <main className="flex-1 pb-[env(safe-area-inset-bottom)] relative z-10">
          {children}
        </main>

        <div className="sticky bottom-0 z-30 w-full">
          <BottomNav />
        </div>
      </div>
    </div>
  );
}