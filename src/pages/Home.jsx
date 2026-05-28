import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, Users, Shuffle, History, Sun, Moon, Send, ChevronLeft, Plus, Check, CheckCircle2, Flame } from 'lucide-react';
import InstallBanner from '@/components/InstallBanner';
import { useTheme } from '@/lib/ThemeContext';
import { useAuth } from '@/lib/AuthContext';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Round } from '@/api/entities';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { toast } from 'sonner';
import { LuxCard, Eyebrow, GoldButton } from '@/components/ui/lux';

const TEAM_NAMES = ['הצהובים', 'הכחולים', 'הכתומים'];
const TEAM_DOT = ['bg-yellow-400', 'bg-blue-400', 'bg-orange-400'];

const QUICK_ACCENT = {
  amber:   { tile: 'bg-amber-500/15 text-amber-300 ring-amber-500/30', glow: 'bg-amber-500/15', sub: 'text-amber-300/70' },
  emerald: { tile: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30', glow: 'bg-emerald-500/15', sub: 'text-emerald-300/70' },
  blue:    { tile: 'bg-sky-500/15 text-sky-300 ring-sky-500/30', glow: 'bg-sky-500/15', sub: 'text-sky-300/70' },
  slate:   { tile: 'bg-slate-500/20 text-slate-300 ring-slate-500/30', glow: 'bg-slate-500/10', sub: 'text-slate-400' },
};

function QuickCard({ to, icon: Icon, title, subtitle, accent = 'amber', delay }) {
  const a = QUICK_ACCENT[accent];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: 'spring', damping: 18, stiffness: 220 }}
    >
      <LuxCard accent={accent === 'blue' ? 'blue' : accent === 'emerald' ? 'emerald' : accent === 'slate' ? 'slate' : 'amber'} className="h-full active:scale-95 transition-transform">
        <Link to={to} className="block relative h-full p-4 touch-manipulation overflow-hidden rounded-[15px]">
          <div className={`absolute -top-7 -left-7 w-20 h-20 rounded-full blur-2xl pointer-events-none ${a.glow}`} />
          <div className="relative flex items-start justify-between">
            <div className={`grid place-items-center w-11 h-11 rounded-xl ring-1 ${a.tile}`}>
              <Icon className="w-[22px] h-[22px]" strokeWidth={2.3} />
            </div>
            <ChevronLeft className="w-4 h-4 text-slate-600 mt-1" strokeWidth={2.5} />
          </div>
          <h3 className="relative text-white font-black text-[0.95rem] leading-tight mt-3">{title}</h3>
          <p className={`relative text-[0.7rem] mt-0.5 font-bold ${a.sub}`}>{subtitle}</p>
        </Link>
      </LuxCard>
    </motion.div>
  );
}

const OUTER_PENT = 'M0,-19 L18.07,-5.87 L11.17,15.37 L-11.17,15.37 L-18.07,-5.87 Z';

function CrestEmblem() {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="סינתטיקו חולון"
      className="w-[36vw] min-w-[126px] max-w-[160px] h-auto"
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
        <radialGradient id="ballSheen" cx="36%" cy="30%" r="74%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.28" />
          <stop offset="58%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="ballClip">
          <circle cx="100" cy="100" r="47" />
        </clipPath>
      </defs>

      <circle cx="100" cy="100" r="97" fill="url(#crestGold)" />
      <circle cx="100" cy="100" r="97" fill="none" stroke="#fffbeb" strokeWidth="1" strokeOpacity="0.55" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#3a2606" strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="100" cy="100" r="89" fill="url(#crestField)" />
      <circle
        cx="100" cy="100" r="78" fill="none" stroke="url(#crestGoldSoft)"
        strokeWidth="2.6" strokeLinecap="round" strokeDasharray="0.1 9" strokeOpacity="0.9"
      />
      <circle cx="100" cy="100" r="60" fill="none" stroke="url(#crestGoldSoft)" strokeWidth="1.3" strokeOpacity="0.4" />
      <circle cx="100" cy="100" r="47" fill="#060b16" />
      <g clipPath="url(#ballClip)">
        <g transform="translate(100 100)">
          <g fill="url(#crestGoldSoft)">
            <g transform="translate(0 -50) rotate(180)"><path d={OUTER_PENT} /></g>
            <g transform="translate(47.55 -15.45) rotate(252)"><path d={OUTER_PENT} /></g>
            <g transform="translate(29.39 40.45) rotate(324)"><path d={OUTER_PENT} /></g>
            <g transform="translate(-29.39 40.45) rotate(36)"><path d={OUTER_PENT} /></g>
            <g transform="translate(-47.55 -15.45) rotate(108)"><path d={OUTER_PENT} /></g>
          </g>
          <g stroke="url(#crestGoldSoft)" strokeWidth="3.6" strokeLinecap="round">
            <line x1="0" y1="-21" x2="0" y2="-47" />
            <line x1="19.97" y1="-6.49" x2="44.70" y2="-14.52" />
            <line x1="12.34" y1="16.99" x2="27.62" y2="38.02" />
            <line x1="-12.34" y1="16.99" x2="-27.62" y2="38.02" />
            <line x1="-19.97" y1="-6.49" x2="-44.70" y2="-14.52" />
          </g>
          <path
            d="M0,-21 L19.97,-6.49 L12.34,16.99 L-12.34,16.99 L-19.97,-6.49 Z"
            fill="url(#crestGoldSoft)"
          />
        </g>
        <circle cx="100" cy="100" r="47" fill="url(#ballSheen)" />
      </g>
      <circle cx="100" cy="100" r="47" fill="none" stroke="url(#crestGold)" strokeWidth="3.2" />
    </svg>
  );
}

export default function Home() {
  const { isDark, setIsDark } = useTheme();
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const queryClient = useQueryClient();
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  const { data: activeRound } = useQuery({
    queryKey: ['latest-round-admin'],
    queryFn: async () => {
      const rounds = await Round.list('-created_date');
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 3);
      cutoff.setHours(0, 0, 0, 0);
      // Admin sees only active (unfinished) rounds
      return rounds.find(r =>
        Array.isArray(r.openingTeams) && r.openingTeams.length >= 2 &&
        r.winningTeam == null &&
        !r.victoryPhoto &&
        !r.is_closed &&
        new Date(r.date) >= cutoff
      ) || null;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });

  // Player-facing query — only published, unfinished rounds. Shares cache with MatchDay/PlayerHome.
  const { data: playerActiveRound } = useQuery({
    queryKey: ['latest-round'],
    queryFn: async () => {
      const rounds = await Round.list('-created_date');
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
    enabled: !isAdmin,
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    refetchOnMount: 'always',
    refetchInterval: 30_000,
  });

  const handlePublish = async () => {
    if (publishing || published) return;
    if (!activeRound) return;
    setPublishing(true);
    try {
      await Round.update(activeRound.id, { is_published: true });
      queryClient.invalidateQueries({ queryKey: ['latest-round'] });
      queryClient.invalidateQueries({ queryKey: ['latest-round-admin'] });
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
      toast.success('ההרכבים פורסמו ונשלחה הודעה לכל השחקנים!');
    } catch {
      toast.error('שגיאה בפרסום');
    }
    setPublishing(false);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col items-center px-5 pt-5 pb-10">
      <div className="w-full max-w-sm">
        {/* ── Active round CTA — player view, prominent on top ── */}
        {!isAdmin && playerActiveRound && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', damping: 22, stiffness: 240 }}
            className="mb-4"
          >
            <Link
              to="/MatchDay"
              className="block relative rounded-2xl p-px bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 active:scale-[0.98] transition-transform touch-manipulation"
              aria-label="מחזור פעיל — היכנס לסביבת המשחק"
            >
              <div className="rounded-[15px] bg-gradient-to-b from-emerald-900 via-emerald-950 to-slate-950 px-4 py-3.5 flex items-center gap-3">
                <div className="relative flex h-10 w-10 shrink-0">
                  <span className="absolute inset-0 rounded-xl bg-emerald-500/30 animate-ping" aria-hidden="true" />
                  <div className="relative grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/25 ring-1 ring-emerald-400/60">
                    <Flame className="w-5 h-5 text-amber-300" strokeWidth={2.4} />
                  </div>
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-rose-500/20 ring-1 ring-rose-400/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" aria-hidden="true" />
                      <span className="text-[0.55rem] text-rose-200 font-black tracking-wider">LIVE</span>
                    </span>
                    <p className="st-gold-text font-black text-sm">מחזור פעיל</p>
                  </div>
                  <p className="text-emerald-100/80 text-[0.7rem] font-bold leading-tight mt-0.5">
                    ההרכבים פורסמו — היכנס לסביבת המשחק
                  </p>
                </div>

                <ChevronLeft className="w-5 h-5 text-amber-300 shrink-0" strokeWidth={2.6} />
              </div>
            </Link>
          </motion.div>
        )}

        {/* Install app button */}
        <InstallBanner />

        {/* Theme toggle */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="flex justify-center mb-3"
        >
          <button
            onClick={() => setIsDark(!isDark)}
            aria-label={isDark ? 'עבור למצב בהיר' : 'עבור למצב כהה'}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-900/70 ring-1 ring-white/10 text-slate-400 active:scale-95 transition-all text-xs font-bold"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            <span>{isDark ? 'מצב בהיר' : 'מצב כהה'}</span>
          </button>
        </motion.div>

        {/* ── Hero ─────────────────────────────────────────────────── */}
        <div className="text-center">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.42 }}
          >
            <Eyebrow>מועדון הכדורגל</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="st-gold-text text-[clamp(3rem,15vw,4.75rem)] font-black leading-[0.92] tracking-tight mt-2"
          >
            סינתטיקו
          </motion.h1>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex items-center justify-center gap-3 mt-1 mb-3"
          >
            <span className="h-[2px] w-12 rounded-full bg-gradient-to-r from-amber-400/80 to-transparent" />
            <span className="text-2xl font-black tracking-[0.22em] text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-400">
              חולון
            </span>
            <span className="h-[2px] w-12 rounded-full bg-gradient-to-l from-amber-400/80 to-transparent" />
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.72 }}
            className="text-ink-3 text-sm font-bold tracking-wide"
          >
            מרכז השליטה של המאמן
          </motion.p>
        </div>

        {/* ── Active round / create CTA — admin only ────────────────── */}
        {isAdmin && (
          <AnimatePresence mode="wait">
            {activeRound ? (
              <motion.div
                key="active"
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ delay: 0.3, type: 'spring', damping: 22, stiffness: 220 }}
                className="mt-7"
              >
                {activeRound.winningTeam != null ? (
                  /* ── Completed round ── */
                  <LuxCard accent="slate">
                    <div className="relative p-4 rounded-[15px]">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={2.6} />
                        <span className="text-emerald-300 font-black text-sm tracking-wide">המחזור הסתיים</span>
                        <span className="text-ink-3 text-xs font-bold mr-auto tnum">
                          {format(new Date(activeRound.date), 'd/M/yyyy', { locale: he })}
                        </span>
                      </div>

                      {/* Winner */}
                      <div className="flex items-center justify-center gap-2 my-3 py-2 rounded-xl bg-slate-800/60 ring-1 ring-white/8">
                        <Trophy className="w-4 h-4 text-amber-400 shrink-0" strokeWidth={2.4} />
                        <span className="text-ink-3 text-xs font-bold">מנצחת:</span>
                        <span className={`font-black text-base ${
                          TEAM_DOT[activeRound.winningTeam] === 'bg-yellow-400' ? 'text-yellow-300'
                          : TEAM_DOT[activeRound.winningTeam] === 'bg-blue-400' ? 'text-blue-300'
                          : 'text-orange-300'
                        }`}>
                          {TEAM_NAMES[activeRound.winningTeam] ?? `קבוצה ${activeRound.winningTeam + 1}`}
                        </span>
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${TEAM_DOT[activeRound.winningTeam] || 'bg-slate-400'}`} />
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 mt-3">
                        <Link
                          to="/GameHistory"
                          className="flex-1 flex items-center justify-center gap-1.5 min-h-[48px] rounded-xl font-black text-sm bg-slate-800/90 ring-1 ring-white/10 text-white active:scale-[0.97] transition-transform"
                        >
                          תוצאות מלאות
                          <ChevronLeft className="w-4 h-4" strokeWidth={2.6} />
                        </Link>
                        <GoldButton as={Link} to={createPageUrl('CreateRound')} className="px-4 min-h-[48px]">
                          <Plus className="w-4 h-4" strokeWidth={2.8} />
                          מחזור חדש
                        </GoldButton>
                      </div>
                    </div>
                  </LuxCard>
                ) : (
                  /* ── Active round (no result yet) ── */
                  <LuxCard accent="emerald" glow>
                    <div className="relative p-4 rounded-[15px]">
                      {/* Header */}
                      <div className="flex items-center gap-2 mb-3">
                        <span className="relative flex h-2.5 w-2.5 shrink-0">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                        </span>
                        <span className="text-emerald-300 font-black text-sm tracking-wide">מחזור פעיל</span>
                        <span className="text-ink-3 text-xs font-bold mr-auto tnum">
                          {format(new Date(activeRound.date), 'd/M/yyyy', { locale: he })}
                        </span>
                      </div>

                      {/* Opening match */}
                      {activeRound.openingTeams?.length >= 2 && (
                        <div className="flex items-center justify-center gap-3 my-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${TEAM_DOT[activeRound.openingTeams[0]] || 'bg-slate-400'}`} />
                            <span className="text-white font-black text-base leading-none">
                              {TEAM_NAMES[activeRound.openingTeams[0]] ?? `קבוצה ${activeRound.openingTeams[0] + 1}`}
                            </span>
                          </div>
                          <span className="st-gold-text text-xs font-black tracking-widest shrink-0">VS</span>
                          <div className="flex items-center gap-1.5">
                            <span className="text-white font-black text-base leading-none">
                              {TEAM_NAMES[activeRound.openingTeams[1]] ?? `קבוצה ${activeRound.openingTeams[1] + 1}`}
                            </span>
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${TEAM_DOT[activeRound.openingTeams[1]] || 'bg-slate-400'}`} />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex gap-2 mt-1">
                        <Link
                          to="/MatchDay"
                          className="flex-1 flex items-center justify-center gap-1.5 min-h-[52px] rounded-xl font-black text-sm bg-slate-800/90 ring-1 ring-white/10 text-white active:scale-[0.97] transition-transform"
                        >
                          סביבת המשחק
                          <ChevronLeft className="w-4 h-4" strokeWidth={2.6} />
                        </Link>
                        <button
                          onClick={handlePublish}
                          disabled={publishing || published}
                          className={`flex items-center justify-center gap-1.5 px-4 min-h-[52px] rounded-xl font-black text-sm transition-all shrink-0 active:scale-[0.97] disabled:opacity-60 ${
                            published
                              ? 'bg-emerald-800/50 text-emerald-300 ring-1 ring-emerald-500/30'
                              : 'st-foil shadow-[0_8px_22px_-8px_rgba(212,160,40,0.6)]'
                          }`}
                        >
                          {published ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                          {publishing ? '...' : published ? 'פורסם' : 'פרסם'}
                        </button>
                      </div>
                    </div>
                  </LuxCard>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="create"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-7"
              >
                <LuxCard accent="slate">
                  <div className="relative p-4 rounded-[15px] text-center">
                    <p className="text-slate-300 text-sm font-bold mb-3">אין מחזור פעיל כרגע</p>
                    <GoldButton as={Link} to={createPageUrl('CreateRound')} className="w-full">
                      <Plus className="w-5 h-5" strokeWidth={2.6} />
                      צור מחזור חדש
                    </GoldButton>
                  </div>
                </LuxCard>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* ── Quick access grid ─────────────────────────────────────── */}
        <div className="mt-7 grid grid-cols-2 gap-3" dir="rtl">
          <QuickCard to={createPageUrl('Podium')} icon={Trophy} title="הפודיום" subtitle="טבלת המובילים" accent="amber" delay={0.85} />
          {isAdmin && (
            <QuickCard to={createPageUrl('Players')} icon={Users} title="סגל שחקנים" subtitle="ניהול הסגל" accent="emerald" delay={0.92} />
          )}
          {isAdmin && (
            <QuickCard to={createPageUrl('CreateRound')} icon={Shuffle} title="יצירת מחזור" subtitle="הגרלת קבוצות" accent="blue" delay={0.99} />
          )}
          <QuickCard to={createPageUrl('GameHistory')} icon={History} title="יומן משחקים" subtitle="היסטוריה ותוצאות" accent="slate" delay={1.06} />
        </div>
      </div>
    </div>
  );
}
