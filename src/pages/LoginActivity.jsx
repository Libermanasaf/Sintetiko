import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, Users, CalendarDays, TrendingUp, User, Clock, Crown, X, MapPin, ChevronLeft, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

// Friendly Hebrew labels for the entry-page paths we record.
const PAGE_LABELS = {
  '/': 'דף הבית', '/Home': 'דף הבית', '/PlayerHome': 'דף הבית',
  '/Statistics': 'סטטיסטיקות', '/Podium': 'פודיום', '/GameHistory': 'היסטוריית משחקים',
  '/RatePlayers': 'דירוג שחקנים', '/Players': 'סגל שחקנים', '/Payments': 'תשלומים',
  '/Lists': 'רשימות', '/MatchDay': 'סביבת המשחק', '/Professionals': 'בעלי המקצוע',
  '/Notifications': 'התראות', '/SignupPage': 'רישום',
  '/DayListSunday': 'רשימת ראשון', '/DayListWednesday': 'רשימת רביעי', '/DayListThursday': 'רשימת חמישי',
};
const pageLabel = (p) => PAGE_LABELS[p] || p || 'לא ידוע';

const RANGES = [
  { days: 7, label: '7 ימים' },
  { days: 30, label: '30 יום' },
  { days: 90, label: '90 יום' },
];

export default function LoginActivity() {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [daily, setDaily] = useState([]);
  const [byUser, setByUser] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState(null); // {user_id, name, email} | null

  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      if (!supabase) return;
      setIsLoading(true);
      try {
        const [s, d, u] = await Promise.all([
          supabase.rpc('login_activity_summary', { p_days: days }),
          supabase.rpc('login_activity_daily', { p_days: days }),
          supabase.rpc('login_activity_by_user', { p_days: days }),
        ]);
        if (cancelled) return;
        if (s.error) throw s.error;
        setSummary(s.data?.[0] || null);
        setDaily(d.data || []);
        setByUser(u.data || []);
      } catch (err) {
        if (!cancelled) toast.error('שגיאה בטעינת הנתונים', { description: err.message });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchAll();
    return () => { cancelled = true; };
  }, [days]);

  // Chart scaling — tallest bar drives the rest. Show oldest→newest left→right.
  const chartData = useMemo(() => [...daily].reverse(), [daily]);
  const maxDaily = useMemo(
    () => Math.max(1, ...chartData.map((r) => Number(r.unique_users) || 0)),
    [chartData]
  );

  const fmtDay = (d) =>
    new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit' });
  const fmtDateTime = (d) =>
    new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' });

  return (
    <div className="pb-10">
      <PageHeader
        icon={LogIn}
        title="כניסות למערכת"
        subtitle="מי נכנס, כמה, ומתי"
        accent="sky"
      />

      <div className="p-4 space-y-4">
        {/* Range toggle */}
        <div className="flex gap-2">
          {RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setDays(r.days)}
              aria-pressed={days === r.days}
              className={`flex-1 min-h-[44px] rounded-xl text-xs font-black ring-1 active:scale-[0.98] transition-all touch-manipulation ${
                days === r.days
                  ? 'bg-sky-900/50 ring-sky-400/60 text-sky-200 shadow-[0_0_0_2px_rgba(56,189,248,0.2)]'
                  : 'bg-slate-800/60 ring-white/8 text-slate-400 hover:bg-slate-800/80'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 rounded-2xl" />
            <Skeleton className="h-48 rounded-2xl" />
            <Skeleton className="h-64 rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-2.5">
              <SummaryCard icon={Users} color="emerald" value={summary?.today_unique ?? 0} label="נכנסו היום" />
              <SummaryCard icon={TrendingUp} color="sky" value={summary?.today_events ?? 0} label="כניסות היום" />
              <SummaryCard icon={User} color="amber" value={summary?.unique_users ?? 0} label={`משתמשים (${days} ימים)`} />
              <SummaryCard icon={CalendarDays} color="violet" value={summary?.total_events ?? 0} label={`סה"כ כניסות (${days} ימים)`} />
            </div>

            {/* Daily chart */}
            <div className="rounded-2xl bg-slate-900/70 ring-1 ring-white/8 p-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarDays className="w-4 h-4 text-sky-400" />
                <h3 className="font-black text-white text-sm">כניסות לפי יום</h3>
                <span className="text-[0.65rem] text-slate-500 font-bold mr-auto">משתמשים ייחודיים</span>
              </div>
              {chartData.length === 0 ? (
                <EmptyState icon={CalendarDays} title="אין נתונים עדיין" hint="כניסות יופיעו כאן ברגע שמשתמשים ייכנסו." />
              ) : (
                <div className="flex items-end gap-1 h-40 overflow-x-auto" dir="ltr">
                  {chartData.map((row) => {
                    const val = Number(row.unique_users) || 0;
                    const h = Math.round((val / maxDaily) * 100);
                    return (
                      <div key={row.day} className="flex flex-col items-center gap-1 flex-1 min-w-[20px] h-full justify-end" title={`${fmtDay(row.day)}: ${val} משתמשים, ${row.total_events} כניסות`}>
                        <span className="text-[0.6rem] font-black text-sky-300 tnum">{val || ''}</span>
                        <div
                          className="w-full max-w-[26px] rounded-t-md bg-gradient-to-t from-sky-600/70 to-sky-400/90 ring-1 ring-sky-400/30 min-h-[2px] transition-all"
                          style={{ height: `${h}%` }}
                        />
                        <span className="text-[0.55rem] text-slate-500 font-bold tnum whitespace-nowrap" dir="rtl">{fmtDay(row.day)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Leaderboard */}
            <div className="rounded-2xl bg-slate-900/70 ring-1 ring-white/8 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Crown className="w-4 h-4 text-amber-400" />
                <h3 className="font-black text-white text-sm">הכי פעילים</h3>
                <span className="text-[0.65rem] text-slate-500 font-bold mr-auto">ימי פעילות · כניסות</span>
              </div>
              {byUser.length === 0 ? (
                <EmptyState icon={Users} title="אין נתונים עדיין" hint="הדירוג יתמלא ככל שמשתמשים ייכנסו." />
              ) : (
                <div className="space-y-2">
                  {byUser.map((u, i) => (
                    <motion.button
                      key={u.user_id || i}
                      type="button"
                      onClick={() => setSelectedUser({ user_id: u.user_id, name: u.name, email: u.email })}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.3) }}
                      className="w-full text-right flex items-center gap-3 rounded-xl bg-slate-800/50 ring-1 ring-white/5 p-2.5 active:scale-[0.99] hover:bg-slate-800/80 transition-all touch-manipulation"
                    >
                      <div className={`grid place-items-center w-7 h-7 rounded-lg text-xs font-black shrink-0 tnum ${
                        i === 0 ? 'bg-amber-500/25 text-amber-300 ring-1 ring-amber-400/40'
                        : i === 1 ? 'bg-slate-400/20 text-slate-200 ring-1 ring-slate-300/30'
                        : i === 2 ? 'bg-orange-700/30 text-orange-300 ring-1 ring-orange-500/30'
                        : 'bg-slate-700/40 text-slate-400'
                      }`}>{i + 1}</div>
                      <div className="grid place-items-center w-9 h-9 rounded-xl st-foil text-sm font-black shrink-0">
                        {(u.name?.[0] || u.email?.[0] || '?').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-black text-white text-sm truncate">{u.name || u.email || '—'}</p>
                        <p className="flex items-center gap-1 text-[0.65rem] text-ink-3 font-bold mt-0.5">
                          <Clock className="w-3 h-3 text-slate-500 shrink-0" />
                          <span className="tnum">נראה לאחרונה {fmtDateTime(u.last_seen)}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-amber-300 font-black text-base tnum leading-none">{u.days_active}</p>
                        <p className="text-slate-500 text-[0.6rem] font-bold mt-0.5 tnum">{u.total_events} כניסות</p>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-slate-600 shrink-0" />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal user={selectedUser} onClose={() => setSelectedUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

function UserDetailModal({ user, onClose }) {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase || !user?.user_id) return;
      const { data, error } = await supabase.rpc('login_activity_user_detail', { p_user_id: user.user_id, p_limit: 100 });
      if (cancelled) return;
      if (error) { toast.error('שגיאה בטעינת הפירוט', { description: error.message }); setEvents([]); return; }
      setEvents(data || []);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const fmt = (d) => new Date(d).toLocaleString('he-IL', {
    day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-md bg-slate-900 ring-1 ring-white/10 rounded-t-3xl sm:rounded-3xl p-5 max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="grid place-items-center w-10 h-10 rounded-xl st-foil text-base font-black shrink-0">
            {(user.name?.[0] || user.email?.[0] || '?').toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-black text-white text-base truncate">{user.name || user.email || '—'}</h2>
            <p className="text-slate-500 text-xs font-bold">פירוט כניסות</p>
          </div>
          <button onClick={onClose} aria-label="סגור" className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800 text-slate-400 active:scale-95"><X className="w-5 h-5" /></button>
        </div>

        {events === null ? (
          <div className="py-10 grid place-items-center text-slate-500"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : events.length === 0 ? (
          <EmptyState icon={Clock} title="אין כניסות מתועדות" hint="הכניסות יופיעו כאן." />
        ) : (
          <div className="space-y-2">
            {events.map((e, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl bg-slate-800/50 ring-1 ring-white/5 p-3">
                <div className={`grid place-items-center w-8 h-8 rounded-lg shrink-0 ${e.event_type === 'login' ? 'bg-sky-500/15 text-sky-300' : 'bg-emerald-500/15 text-emerald-300'}`}>
                  {e.event_type === 'login' ? <LogIn className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-sm font-bold tnum">{fmt(e.created_date)}</p>
                  <p className="flex items-center gap-1 text-[0.65rem] text-ink-3 font-bold mt-0.5">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    {pageLabel(e.entry_page)}
                  </p>
                </div>
                <span className="text-[0.6rem] font-black px-2 py-0.5 rounded-full bg-slate-700/60 text-slate-300 shrink-0">
                  {e.event_type === 'login' ? 'התחברות' : 'נוכחות'}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

const COLOR_MAP = {
  emerald: ['bg-emerald-500/15', 'ring-emerald-500/25', 'bg-emerald-500/20', 'text-emerald-400', 'text-emerald-300', 'text-emerald-300/60'],
  sky:     ['bg-sky-500/15', 'ring-sky-500/25', 'bg-sky-500/20', 'text-sky-400', 'text-sky-300', 'text-sky-300/60'],
  amber:   ['bg-amber-500/15', 'ring-amber-500/25', 'bg-amber-500/20', 'text-amber-400', 'text-amber-300', 'text-amber-300/60'],
  violet:  ['bg-violet-500/15', 'ring-violet-500/25', 'bg-violet-500/20', 'text-violet-400', 'text-violet-300', 'text-violet-300/60'],
};

function SummaryCard({ icon: Icon, color, value, label }) {
  const [bg, ring, iconBg, iconText, valText, labelText] = COLOR_MAP[color] || COLOR_MAP.sky;
  return (
    <div className={`rounded-2xl p-3.5 flex items-center gap-2.5 ring-1 ${bg} ${ring}`}>
      <div className={`grid place-items-center w-9 h-9 rounded-xl shrink-0 ${iconBg}`}>
        <Icon className={`w-4 h-4 ${iconText}`} />
      </div>
      <div className="text-right min-w-0">
        <p className={`font-black text-lg tnum leading-none ${valText}`}>{value}</p>
        <p className={`text-[0.65rem] font-bold mt-0.5 truncate ${labelText}`}>{label}</p>
      </div>
    </div>
  );
}
