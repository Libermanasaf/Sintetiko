import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, Users, Shuffle, History, Sun, Moon, Send, ChevronLeft } from 'lucide-react';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Round } from '@/api/entities';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { LuxCard } from '@/components/ui/lux';

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים'];

const QUICK_ACCENT = {
  amber:   { icon: 'bg-amber-500/15 text-amber-400 ring-amber-500/30', glow: 'bg-amber-500/15', sub: 'text-amber-300/70' },
  emerald: { icon: 'bg-emerald-500/15 text-emerald-400 ring-emerald-500/30', glow: 'bg-emerald-500/15', sub: 'text-emerald-300/70' },
  blue:    { icon: 'bg-blue-500/15 text-blue-400 ring-blue-500/30', glow: 'bg-blue-500/15', sub: 'text-blue-300/70' },
  slate:   { icon: 'bg-slate-500/20 text-slate-300 ring-slate-500/30', glow: 'bg-slate-500/10', sub: 'text-slate-400' },
};

function QuickCard({ to, icon: Icon, title, subtitle, accent = 'amber', delay }) {
  const a = QUICK_ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', damping: 16, stiffness: 200 }}
    >
      <LuxCard accent={accent === 'slate' ? 'slate' : accent} className="active:scale-95 transition-transform">
        <Link to={to} className="block relative p-4 touch-manipulation overflow-hidden rounded-[15px]">
          <div className={`absolute -top-6 -left-6 w-20 h-20 rounded-full blur-2xl pointer-events-none ${a.glow}`} />
          <div className={`relative w-11 h-11 rounded-xl flex items-center justify-center ring-1 mb-3 ${a.icon}`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="relative text-white font-black text-base leading-tight">{title}</h3>
          <p className={`relative text-xs mt-0.5 font-semibold ${a.sub}`}>{subtitle}</p>
        </Link>
      </LuxCard>
    </motion.div>
  );
}

function CrestEmblem() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="סינתטיקו חולון"
      className="w-[34vw] min-w-[118px] max-w-[148px] h-auto"
    >
      <defs>
        <linearGradient id="crestGold" x1="22" y1="8" x2="178" y2="194" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fef3c7" />
          <stop offset="26%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#c2780b" />
          <stop offset="73%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#8a5208" />
        </linearGradient>
        <linearGradient id="crestGoldSoft" x1="0" y1="6" x2="0" y2="194" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fff7e0" />
          <stop offset="46%" stopColor="#fcd34d" />
          <stop offset="100%" stopColor="#b06f0a" />
        </linearGradient>
        <radialGradient id="crestField" cx="50%" cy="34%" r="80%">
          <stop offset="0%" stopColor="#114b3c" />
          <stop offset="50%" stopColor="#0b1a26" />
          <stop offset="100%" stopColor="#020510" />
        </radialGradient>
        <linearGradient id="bootPink" x1="0" y1="0" x2="0.65" y2="1">
          <stop offset="0%" stopColor="#ffa6d4" />
          <stop offset="50%" stopColor="#f81f8e" />
          <stop offset="100%" stopColor="#b3155f" />
        </linearGradient>
        <radialGradient id="ballLight" cx="38%" cy="34%" r="78%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="68%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>
      </defs>

      {/* outer gold ring */}
      <circle cx="100" cy="100" r="97" fill="url(#crestGold)" />
      <circle cx="100" cy="100" r="97" fill="none" stroke="#fffbeb" strokeWidth="1" strokeOpacity="0.55" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#3a2606" strokeWidth="1.5" strokeOpacity="0.6" />

      {/* dark field */}
      <circle cx="100" cy="100" r="89" fill="url(#crestField)" />

      {/* dotted medallion ring */}
      <circle
        cx="100"
        cy="100"
        r="78"
        fill="none"
        stroke="url(#crestGoldSoft)"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeDasharray="0.1 9"
        strokeOpacity="0.9"
      />

      {/* player — kicking follow-through */}
      <g fill="none" stroke="url(#crestGoldSoft)" strokeLinecap="round" strokeLinejoin="round">
        <path d="M84 72 L64 78 L52 62" strokeWidth="11" />
        <path d="M91 108 L80 130 L74 152" strokeWidth="15" />
        <path d="M91 108 L114 90 L133 76" strokeWidth="15" />
        <path d="M84 72 L91 108" strokeWidth="23" />
        <path d="M84 72 L102 80 L116 66" strokeWidth="11" />
      </g>
      <circle cx="78" cy="53" r="12.5" fill="url(#crestGoldSoft)" />

      {/* pink Mercurial boots */}
      <g fill="none" stroke="url(#bootPink)" strokeLinecap="round">
        <path d="M66 153 L90 151" strokeWidth="13" />
        <path d="M132 77 L147 66" strokeWidth="13" />
      </g>

      {/* ball — just struck */}
      <circle cx="150" cy="57" r="10.5" fill="url(#ballLight)" stroke="url(#crestGold)" strokeWidth="1.6" />
      <path
        d="M150 52.6 L154.18 55.64 L152.59 60.56 L147.41 60.56 L145.82 55.64 Z"
        fill="#0b1220"
      />
    </svg>
  );
}

export default function Home() {
  const { isDark, setIsDark } = useTheme();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const { data: activeRound } = useQuery({
    queryKey: ['latest-round'],
    queryFn: async () => {
      const rounds = await Round.list('-created_date');
      return rounds.find(r =>
        Array.isArray(r.openingTeams) && r.openingTeams.length >= 2 &&
        r.winningTeam == null &&
        !r.victoryPhoto
      ) || null;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  const handlePublish = async () => {
    if (publishing || published) return;
    setPublishing(true);
    try {
      await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'פורסמו הרכבים!',
          body: 'הרכבי המחזור החדש מוכנים — לחץ לצפייה',
          url: '/MatchDay',
        }),
      });
      setPublished(true);
      toast.success('ההודעה נשלחה לכל השחקנים!');
    } catch {
      toast.error('שגיאה בשליחת ההודעה');
    }
    setPublishing(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-5 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center w-full max-w-sm"
      >
        {/* Theme Toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-amber-500/20 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-all shadow-sm text-sm font-medium"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>מצב בהיר</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-500" />
                <span>מצב כהה</span>
              </>
            )}
          </button>
        </motion.div>

        {/* Football crest */}
        <motion.div
          initial={{ scale: 0, rotate: -25, opacity: 0 }}
          animate={{ scale: 1, rotate: 0, opacity: 1 }}
          transition={{ delay: 0.25, type: 'spring', stiffness: 160, damping: 14 }}
          className="relative flex justify-center mb-6"
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-44 h-44 bg-amber-500/25 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut' }}
            className="relative flex justify-center"
            style={{ filter: 'drop-shadow(0 10px 22px rgba(0,0,0,0.55))' }}
          >
            <CrestEmblem />
          </motion.div>
        </motion.div>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.42 }}
          className="flex items-center justify-center gap-2.5 mb-2"
        >
          <span className="h-px w-7 bg-gradient-to-r from-amber-400/70 to-transparent" />
          <span className="text-[10px] font-bold tracking-[0.34em] text-amber-400/90">מועדון הכדורגל</span>
          <span className="h-px w-7 bg-gradient-to-r from-transparent to-amber-400/70" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="text-[clamp(3rem,14vw,4.5rem)] font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-100 via-amber-400 to-amber-700 leading-[0.95] tracking-tight"
          style={{ filter: 'drop-shadow(0 2px 10px rgba(200,150,25,0.4))' }}
        >
          סינתטיקו
        </motion.h1>

        {/* Holon between gold rules */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="flex items-center justify-center gap-3 mt-1.5 mb-5"
        >
          <span className="h-[2px] w-12 rounded-full bg-gradient-to-r from-amber-400/80 to-transparent" />
          <span className="text-2xl md:text-3xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
            חולון
          </span>
          <span className="h-[2px] w-12 rounded-full bg-gradient-to-r from-transparent to-amber-400/80" />
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.72, duration: 0.5 }}
          className="text-slate-500 dark:text-slate-400 text-sm font-medium tracking-wide"
        >
          ניהול קבוצה חכם ופשוט
        </motion.p>

        {/* Active round card — admin only */}
        <AnimatePresence>
          {isAdmin && activeRound && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: 0.3, type: 'spring', damping: 20, stiffness: 200 }}
              className="mt-8"
              dir="rtl"
            >
              <LuxCard accent="emerald">
                <div className="relative p-4 overflow-hidden rounded-[15px]">
                  <div className="absolute -top-8 -right-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

                  {/* Header */}
                  <div className="relative flex items-center gap-2 mb-3">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    </span>
                    <span className="text-emerald-300 font-black text-sm">מחזור פעיל</span>
                    <span className="text-slate-400 text-xs mr-auto">
                      {format(new Date(activeRound.date), "d/M/yyyy", { locale: he })}
                    </span>
                  </div>

                  {/* Opening match */}
                  {activeRound.openingTeams?.length >= 2 && (
                    <div className="relative flex items-center justify-center gap-2 mb-3 text-sm font-black">
                      <span className="text-yellow-400">{TEAM_NAMES[activeRound.openingTeams[0]] ?? `קבוצה ${activeRound.openingTeams[0]+1}`}</span>
                      <span className="text-slate-500 text-xs">VS</span>
                      <span className="text-blue-400">{TEAM_NAMES[activeRound.openingTeams[1]] ?? `קבוצה ${activeRound.openingTeams[1]+1}`}</span>
                    </div>
                  )}

                  {/* Buttons */}
                  <div className="relative flex gap-2">
                    <Link
                      to="/MatchDay"
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl font-bold text-sm touch-manipulation bg-slate-700/80 hover:bg-slate-600 active:bg-slate-700 text-white transition-colors"
                    >
                      כנס לסביבת המשחק
                      <ChevronLeft className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={handlePublish}
                      disabled={publishing || published}
                      className={`flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-sm touch-manipulation transition-all shrink-0 ${
                        published
                          ? 'bg-emerald-800/50 text-emerald-400 cursor-default'
                          : 'bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 active:scale-95 text-white disabled:opacity-50 shadow-lg shadow-emerald-900/40'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      {publishing ? '...' : published ? '✓' : 'פרסם'}
                    </button>
                  </div>
                </div>
              </LuxCard>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Access Menu */}
        <div className="mt-8 grid grid-cols-2 gap-3" dir="rtl">
          <QuickCard
            to={createPageUrl('Podium')}
            icon={Trophy}
            title="הפודיום"
            subtitle="המובילים"
            accent="amber"
            delay={0.85}
          />
          {isAdmin && (
            <QuickCard
              to={createPageUrl('Players')}
              icon={Users}
              title="סגל שחקנים"
              subtitle="ניהול שחקנים"
              accent="emerald"
              delay={0.92}
            />
          )}
          {isAdmin && (
            <QuickCard
              to={createPageUrl('CreateRound')}
              icon={Shuffle}
              title="יצירת מחזור"
              subtitle="הגרלת קבוצות"
              accent="blue"
              delay={0.99}
            />
          )}
          <QuickCard
            to={createPageUrl('GameHistory')}
            icon={History}
            title="יומן משחקים"
            subtitle="היסטוריה"
            accent="slate"
            delay={1.06}
          />
        </div>
      </motion.div>
    </div>
  );
}
