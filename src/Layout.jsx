import React, { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '@/components/navigation/Sidebar';
import BottomNav from '@/components/navigation/BottomNav';

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/30 transition-colors duration-300">
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
      
      <main className="pt-16 min-h-screen pb-[env(safe-area-inset-bottom)]">
        {children}
      </main>

      <BottomNav />
    </div>
  );
}