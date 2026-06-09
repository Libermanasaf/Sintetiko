import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, User, MessageSquare, CheckCircle2, Clock, X } from 'lucide-react';
import { toast } from 'sonner';
import { Signup, Player } from '@/api/entities';
import { PageHeader, Skeleton } from '@/components/ui/lux';
import { useAuth } from '@/lib/AuthContext';
import { callApi } from '@/lib/apiClient';
import { createPageUrl } from '@/utils';

const ADMIN_EMAIL = 'libermanasaf@gmail.com';

const DAYS = [
  { key: 'sunday',    label: 'יום ראשון', color: 'text-amber-300',  ring: 'ring-amber-400/30',  bg: 'from-amber-500/20 to-amber-600/5',  dot: 'bg-amber-400'  },
  { key: 'wednesday', label: 'יום רביעי', color: 'text-blue-300',   ring: 'ring-blue-400/30',   bg: 'from-blue-500/20 to-blue-600/5',   dot: 'bg-blue-400'   },
  { key: 'thursday',  label: 'יום חמישי', color: 'text-emerald-300',ring: 'ring-emerald-400/30',bg: 'from-emerald-500/20 to-emerald-600/5',dot: 'bg-emerald-400'},
];

/* ─── Player view ────────────────────────────────────── */
function PlayerRegistration({ players, user, signups, role }) {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const [note, setNote] = useState('');
  const [done, setDone] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const isAdminUser = role === 'admin' || user?.email?.toLowerCase() === ADMIN_EMAIL;

  const registeredDays = useMemo(() =>
    new Set((signups || [])
      .filter(s => s.user_email?.toLowerCase() === user?.email?.toLowerCase())
      .map(s => s.day)),
    [signups, user]);

  // Navigate to PlayerHome 2s after success
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => navigate(createPageUrl('PlayerHome')), 2000);
    return () => clearTimeout(t);
  }, [done, navigate]);

  const sendAdminPush = async (playerName, dayLabel) => {
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetEmail: ADMIN_EMAIL,
          title: 'סינתטיקו — רישום חדש 📝',
          body: `${playerName} נרשם ל${dayLabel} וממתין לאישור`,
          url: createPageUrl('Lists'),
        }),
      });
      const data = await res.json().catch(() => ({}));
      console.log('[push to admin]', res.status, data);
      if (!res.ok) {
        console.warn('[push to admin] failed:', data.error || res.status);
      } else if ((data.sent || 0) === 0) {
        console.warn('[push to admin] no subscriptions for', ADMIN_EMAIL);
      }
    } catch (e) {
      console.warn('[push to admin] network error', e);
    }
  };

  const createMutation = useMutation({
    mutationFn: (data) => Signup.create(data),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['signups'] });
      const dayLabel = DAYS.find(d => d.key === vars.day)?.label || '';
      sendAdminPush(vars.player_name, dayLabel);
      setErrorMsg(null);
      setDone(true);
    },
    onError: (e) => {
      console.error('[signup]', e);
      setErrorMsg(e?.message || 'שגיאה לא ידועה');
      toast.error('שגיאה ברישום — נסה שוב');
    },
  });

  const handleSubmit = () => {
    setErrorMsg(null);
    if (!selectedDay) { setErrorMsg('יש לבחור יום'); return; }
    if (!selectedPlayerId) { setErrorMsg('יש לבחור שם שחקן'); return; }
    const player = players.find(p => p.id === selectedPlayerId);
    if (!player) { setErrorMsg('שחקן לא נמצא'); return; }

    // Validate: logged-in user must match selected player (skip for admin)
    if (!isAdminUser) {
      const emailMatch = player.email?.toLowerCase() === user?.email?.toLowerCase();
      const idMatch = player.user_id && player.user_id === user?.id;
      if (!emailMatch && !idMatch) {
        setErrorMsg('לא ניתן להירשם בשם שחקן אחר — בחר את שמך מהרשימה');
        return;
      }
    }
    if (registeredDays.has(selectedDay)) {
      setErrorMsg('כבר נרשמת ליום זה');
      return;
    }

    createMutation.mutate({
      player_id: player.id,
      player_name: player.name,
      user_email: user?.email?.toLowerCase() || 'unknown',
      day: selectedDay,
      note: note.trim(),
      status: 'waiting',
    });
  };

  const dayInfo = DAYS.find(d => d.key === selectedDay);

  if (done) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="rounded-2xl bg-emerald-900/30 ring-1 ring-emerald-500/25 p-6 text-center">
        <div className="grid place-items-center w-16 h-16 rounded-2xl bg-emerald-500/20 ring-1 ring-emerald-500/30 mx-auto mb-3">
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
        <h2 className="text-emerald-300 font-black text-lg">הרישום בוצע בהצלחה!</h2>
        <p className="text-slate-300 text-sm font-bold mt-1">{dayInfo?.label}</p>
        <p className="text-slate-400 text-xs font-medium mt-1">תעודכן בהקדם על ידי המנהל</p>
        <p className="text-ink-3 text-[0.65rem] font-bold mt-3">חוזר למסך הבית...</p>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Day picker */}
      <div className="space-y-2">
        <p className="text-ink-2 text-xs font-black px-1">בחר יום</p>
        <div className="grid grid-cols-3 gap-2">
          {DAYS.map(d => {
            const taken = registeredDays.has(d.key);
            return (
              <button key={d.key} onClick={() => !taken && setSelectedDay(d.key)} disabled={taken}
                className={`flex flex-col items-center gap-1.5 py-4 rounded-2xl ring-1 transition-all touch-manipulation ${
                  selectedDay === d.key
                    ? `bg-gradient-to-b ${d.bg} ${d.ring} shadow-lg`
                    : taken
                    ? 'bg-slate-800/30 ring-white/5 opacity-50 cursor-not-allowed'
                    : 'bg-slate-800/60 ring-white/8 active:scale-95'
                }`}>
                <span className={`w-2.5 h-2.5 rounded-full ${d.dot}`} />
                <span className={`font-black text-xs ${selectedDay === d.key ? d.color : 'text-slate-300'}`}>{d.label}</span>
                {taken && <span className="text-[0.6rem] text-emerald-400 font-bold">רשום</span>}
              </button>
            );
          })}
        </div>
      </div>

      <AnimatePresence>
        {selectedDay && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Name selector */}
            <div className="rounded-xl bg-slate-800/60 ring-1 ring-white/8 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/6">
                <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-black text-slate-300">שם השחקן</span>
              </div>
              <select value={selectedPlayerId} onChange={e => setSelectedPlayerId(e.target.value)}
                className="w-full bg-slate-900 text-white font-bold text-sm px-3 py-3 outline-none cursor-pointer" dir="rtl">
                <option value="">— בחר את שמך —</option>
                {[...players].sort((a, b) => a.name.localeCompare(b.name, 'he')).map(p => (
                  <option key={p.id} value={p.id} className="bg-slate-900">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div className="rounded-xl bg-slate-800/60 ring-1 ring-white/8 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/6">
                <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-xs font-black text-slate-300">הערה (אופציונלי)</span>
              </div>
              <textarea value={note} onChange={e => setNote(e.target.value)}
                placeholder="הוסף הערה..." rows={2}
                className="w-full bg-transparent text-white font-medium text-sm px-3 py-2.5 outline-none resize-none placeholder:text-white/20"
                dir="rtl" />
            </div>

            {/* Submit */}
            <button onClick={handleSubmit}
              disabled={!selectedPlayerId || createMutation.isPending}
              className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-xl st-foil font-black text-base shadow-[0_8px_22px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] disabled:opacity-50 transition-all touch-manipulation">
              {createMutation.isPending
                ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <CheckCircle2 className="w-5 h-5" />}
              {createMutation.isPending ? 'שולח...' : 'אני בפנים!'}
            </button>

            {/* Inline error */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl bg-rose-900/40 ring-1 ring-rose-500/40 px-4 py-3 flex items-start gap-2"
              >
                <X className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                <p className="text-rose-200 text-xs font-bold leading-snug">{errorMsg}</p>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Admin view ─────────────────────────────────────── */
function AdminSignups({ signups, players, isLoading }) {
  const queryClient = useQueryClient();
  const [busyId, setBusyId] = useState(null);

  const updateMutation = useMutation({
    mutationFn: ({ id, status }) => Signup.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['signups'] }),
  });

  const handleConfirm = async (signup) => {
    setBusyId(signup.id);
    try {
      await updateMutation.mutateAsync({ id: signup.id, status: 'confirmed' });
      const player = players.find(p => p.id === signup.player_id);
      const email = player?.email || signup.user_email;
      if (email) {
        await callApi('/api/send-notification', {
          targetEmail: email,
          title: 'סינתטיקו חולון — אתה בפנים! ✅',
          body: `${signup.player_name}, הגעתך ל${DAYS.find(d => d.key === signup.day)?.label} אושרה!`,
          url: '/',
        });
      }
      toast.success(`${signup.player_name} אושר ונשלחה התראה`);
    } catch { toast.error('שגיאה באישור'); }
    finally { setBusyId(null); }
  };

  const handleWaiting = async (signup) => {
    setBusyId(signup.id);
    try {
      await updateMutation.mutateAsync({ id: signup.id, status: 'waiting' });
      toast.info(`${signup.player_name} הועבר לרשימת ממתינים`);
    } finally { setBusyId(null); }
  };

  const handleDelete = async (signup) => {
    setBusyId(signup.id);
    try {
      await Signup.delete(signup.id);
      queryClient.invalidateQueries({ queryKey: ['signups'] });
      toast.success('הרישום הוסר');
    } finally { setBusyId(null); }
  };

  if (isLoading) return <Skeleton className="h-48 rounded-2xl" />;

  return (
    <div className="space-y-4">
      {DAYS.map(day => {
        const daySignups = (signups || [])
          .filter(s => s.day === day.key)
          .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
        const confirmed = daySignups.filter(s => s.status === 'confirmed').length;

        return (
          <div key={day.key} className={`rounded-2xl bg-slate-900/70 ring-1 ${day.ring} overflow-hidden`}>
            <div className={`bg-gradient-to-l ${day.bg} px-4 py-3 flex items-center gap-2 border-b border-white/8`}>
              <span className={`w-2.5 h-2.5 rounded-full ${day.dot}`} />
              <h2 className={`font-black text-base ${day.color}`}>{day.label}</h2>
              <span className="mr-auto text-xs font-black text-slate-400">{confirmed}/{daySignups.length} מאושרים</span>
            </div>

            {daySignups.length === 0 ? (
              <div className="px-4 py-6 text-center text-slate-500 text-sm font-bold">אין רישומים עדיין</div>
            ) : (
              <div className="divide-y divide-white/5">
                {daySignups.map(s => {
                  const busy = busyId === s.id;
                  const isConfirmed = s.status === 'confirmed';
                  return (
                    <div key={s.id} className="flex items-start gap-3 px-4 py-3">
                      <div className={`grid place-items-center w-7 h-7 rounded-full shrink-0 mt-0.5 ${isConfirmed ? 'bg-emerald-500/20 ring-1 ring-emerald-500/30' : 'bg-amber-500/15 ring-1 ring-amber-400/20'}`}>
                        {isConfirmed
                          ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          : <Clock className="w-3.5 h-3.5 text-amber-400" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-black text-sm">{s.player_name}</p>
                        {s.note && <p className="text-slate-400 text-xs font-medium mt-0.5 leading-snug">{s.note}</p>}
                        <p className={`text-[0.65rem] font-bold mt-0.5 ${isConfirmed ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {isConfirmed ? 'מאושר' : 'ממתין לאישור'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isConfirmed && (
                          <button onClick={() => handleConfirm(s)} disabled={busy}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-500/15 ring-1 ring-emerald-500/30 text-emerald-300 text-xs font-black active:scale-95 disabled:opacity-50 touch-manipulation">
                            {busy ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                            אשר הגעה
                          </button>
                        )}
                        {isConfirmed && (
                          <button onClick={() => handleWaiting(s)} disabled={busy}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 ring-1 ring-amber-400/25 text-amber-300 text-xs font-black active:scale-95 disabled:opacity-50 touch-manipulation">
                            {busy ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Clock className="w-3 h-3" />}
                            ממתינים
                          </button>
                        )}
                        <button onClick={() => handleDelete(s)} disabled={busy}
                          className="grid place-items-center w-7 h-7 rounded-lg bg-slate-700/60 ring-1 ring-white/8 text-slate-500 hover:text-rose-400 active:scale-95 transition-all">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main page ──────────────────────────────────────── */
export default function SignupPage() {
  const { user, loginMode, role } = useAuth();
  const isAdmin = loginMode ? loginMode === 'admin' : role === 'admin';

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
  });

  const { data: signups = [], isLoading } = useQuery({
    queryKey: ['signups'],
    queryFn: () => Signup.list('-created_date'),
    staleTime: 15_000,
    refetchInterval: isAdmin ? 30000 : false,
  });

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader icon={ClipboardCheck} title="רישום" subtitle="רישום לימי המשחק" accent="amber" />
      <div className="p-4 max-w-lg mx-auto space-y-4">
        {isAdmin
          ? <AdminSignups signups={signups} players={players} isLoading={isLoading} />
          : <PlayerRegistration players={players} user={user} signups={signups} role={role} />
        }
      </div>
    </div>
  );
}
