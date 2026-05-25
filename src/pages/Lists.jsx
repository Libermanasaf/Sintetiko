import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, RotateCcw, Pencil, Check, CheckCircle2, X as XIcon, Clock, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/lux';
import { Signup, Player } from '@/api/entities';
import { supabase } from '@/lib/supabase';

const SIGNUPS_TABLE_SQL = `CREATE TABLE signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID,
  player_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  day TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'waiting',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE signups DISABLE ROW LEVEL SECURITY;`;

const WAITING_ROWS = 6;

const DAY_LABELS = { sunday: 'יום ראשון', wednesday: 'יום רביעי', thursday: 'יום חמישי' };

const DEFAULTS = {
  headers: { sunday: 'יום ראשון', wednesday: 'יום רביעי', thursday: 'יום חמישי' },
  rows: {
    sunday: [
      'גלעד עוזיאל', 'אריאל רביבו', 'יוסף משומר', 'אופיר אוחיון',
      'מאור חימי', 'אביחי שרה קאן', 'מתן גינאדי', 'יניב אזולאי',
      'תמיר אברהם', 'אלכס מור', 'ניב מזרחי', 'גל לוי',
      'גל דניאל', 'חן נצר', 'לירן לוי', 'מאור קאקולי',
      'בר ממן', 'דוד דסלין',
    ],
    wednesday: [
      'רחמים רזמן', 'אוהד סנדיק', 'ניק ירושנקו', 'מאור חימי',
      'חן נצר', 'דניאל יוסיפוב', 'דניאל רוטרו', 'זיז איסרס',
      'אסף אמרטלי', 'מידד חליבה', 'אלי יוחנן', 'אוראל יוחנן',
      'גל בן חמו', 'אביתר שם טוב', 'יניב אזולאי', 'אייל קלאוס',
      '', '',
    ],
    thursday: [
      'אסף ליברמן', 'תמיר אברהם', 'אור נחמיאס', 'ארז דיין',
      'גל דניאל', 'דור ביטון', 'דוד דסלין', 'גלעד עוזיאל',
      'סטיו אבן', 'בר ממן', 'לירן לוי', 'מאור קאקולי',
      'ראם כהן', 'עידן טל', 'בן חנאי', '', '', '',
    ],
  },
};

const DAYS = [
  { key: 'sunday',    color: 'text-amber-300',   ring: 'ring-amber-400/30',   bg: 'from-amber-500/15 to-amber-600/5' },
  { key: 'wednesday', color: 'text-blue-300',     ring: 'ring-blue-400/30',    bg: 'from-blue-500/15 to-blue-600/5' },
  { key: 'thursday',  color: 'text-emerald-300',  ring: 'ring-emerald-400/30', bg: 'from-emerald-500/15 to-emerald-600/5' },
];

const STORAGE_KEY = 'sintetiko_lists_v2';

function emptyWaiting() {
  return { sunday: Array(WAITING_ROWS).fill(''), wednesday: Array(WAITING_ROWS).fill(''), thursday: Array(WAITING_ROWS).fill('') };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.rows && p.headers) {
        return { ...p, waiting: p.waiting || emptyWaiting() };
      }
    }
  } catch {}
  return { ...DEFAULTS, waiting: emptyWaiting() };
}

function persist(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function EditableHeader({ value, color, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  const startEdit = () => { setDraft(value); setEditing(true); setTimeout(() => inputRef.current?.focus(), 0); };
  const commit = () => { onChange(draft.trim() || value); setEditing(false); };
  const onKeyDown = (e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <input ref={inputRef} value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={onKeyDown}
          className={`flex-1 min-w-0 bg-transparent font-black text-base ${color} outline-none border-b border-current`} dir="rtl" />
        <button onClick={commit} className={`shrink-0 ${color} active:scale-95`}><Check className="w-4 h-4" /></button>
      </div>
    );
  }
  return (
    <button onClick={startEdit} className={`flex items-center gap-1.5 font-black text-base ${color} active:opacity-70 group`}>
      {value}
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

export default function Lists() {
  const [data, setData] = useState(load);
  const [busyId, setBusyId] = useState(null);
  const [tableMissing, setTableMissing] = useState(false);
  const queryClient = useQueryClient();

  // Probe whether signups table exists in Supabase
  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const { error } = await supabase.from('signups').select('id').limit(1);
      if (error && /does not exist|relation/i.test(error.message)) {
        setTableMissing(true);
      }
    })();
  }, []);

  // Live signups from the SignupPage flow
  const { data: signups = [] } = useQuery({
    queryKey: ['signups'],
    queryFn: () => Signup.list('-created_date'),
    refetchInterval: 10000,
  });
  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
  });

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(SIGNUPS_TABLE_SQL);
      toast.success('ה-SQL הועתק! הדבק ב-Supabase SQL Editor');
    } catch {
      toast.error('לא ניתן להעתיק — סמן ידנית');
    }
  };

  const handleRowChange = useCallback((day, idx, value) => {
    setData(prev => {
      const next = { ...prev, rows: { ...prev.rows, [day]: prev.rows[day].map((v, i) => i === idx ? value : v) } };
      persist(next); return next;
    });
  }, []);

  const handleWaitingChange = useCallback((day, idx, value) => {
    setData(prev => {
      const next = { ...prev, waiting: { ...prev.waiting, [day]: prev.waiting[day].map((v, i) => i === idx ? value : v) } };
      persist(next); return next;
    });
  }, []);

  const handleHeaderChange = useCallback((day, value) => {
    setData(prev => {
      const next = { ...prev, headers: { ...prev.headers, [day]: value } };
      persist(next); return next;
    });
  }, []);

  const resetDay = useCallback((day) => {
    setData(prev => {
      const next = { ...prev, rows: { ...prev.rows, [day]: [...DEFAULTS.rows[day]] }, waiting: { ...prev.waiting, [day]: Array(WAITING_ROWS).fill('') } };
      persist(next); return next;
    });
  }, []);

  // Confirm a signup: send push to player + add name to first empty main row + delete signup
  const handleConfirmSignup = async (signup) => {
    setBusyId(signup.id);
    try {
      // Add to main list at first empty slot
      setData(prev => {
        const rows = [...prev.rows[signup.day]];
        const emptyIdx = rows.findIndex(r => !r || !r.trim());
        if (emptyIdx >= 0) {
          rows[emptyIdx] = signup.player_name;
        } else {
          rows.push(signup.player_name);
        }
        const next = { ...prev, rows: { ...prev.rows, [signup.day]: rows } };
        persist(next);
        return next;
      });

      // Send push to player
      const player = players.find(p => p.id === signup.player_id);
      const email = player?.email || signup.user_email;
      if (email && email !== 'unknown') {
        try {
          const res = await fetch('/api/send-notification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetEmail: email,
              title: 'סינתטיקו חולון — אתה בפנים! ✅',
              body: `${signup.player_name}, הגעתך ל${DAY_LABELS[signup.day]} אושרה`,
              url: '/',
            }),
          });
          if (!res.ok) console.warn('[push to player] failed', await res.text());
        } catch (e) { console.warn('[push to player]', e); }
      }

      // Remove from signups
      await Signup.delete(signup.id);
      queryClient.invalidateQueries({ queryKey: ['signups'] });
      toast.success(`${signup.player_name} אושר ונוסף לרשימה!`);
    } catch (e) {
      console.error('[confirm signup]', e);
      toast.error('שגיאה באישור');
    } finally {
      setBusyId(null);
    }
  };

  const handleDeleteSignup = async (signup) => {
    setBusyId(signup.id);
    try {
      await Signup.delete(signup.id);
      queryClient.invalidateQueries({ queryKey: ['signups'] });
      toast.info(`${signup.player_name} הוסר`);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader icon={ClipboardList} title="רשימות" subtitle="רשימות נוכחות לפי יום" accent="amber" />

      {tableMissing && (
        <div className="px-4 pt-2">
          <div className="rounded-2xl bg-rose-900/30 ring-1 ring-rose-500/40 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-rose-200 font-black text-sm">רישומי השחקנים לא יסונכרנו בין מכשירים</p>
                <p className="text-rose-300/80 text-xs font-medium mt-1 leading-snug">
                  טבלת <span className="font-mono">signups</span> חסרה ב-Supabase. כל עוד היא לא קיימת — כשחקן נרשם, הרישום נשמר רק בדפדפן שלו ולא יופיע אצלך. הרץ את ה-SQL הבא ב-Supabase Dashboard → SQL Editor:
                </p>
              </div>
            </div>
            <pre className="rounded-lg bg-slate-950/70 ring-1 ring-white/10 p-3 text-[0.7rem] font-mono text-slate-300 overflow-x-auto" dir="ltr">{SIGNUPS_TABLE_SQL}</pre>
            <button onClick={copySQL}
              className="w-full flex items-center justify-center gap-2 min-h-[40px] rounded-lg bg-rose-500/20 ring-1 ring-rose-500/40 text-rose-200 font-black text-xs active:scale-[0.98] transition-all touch-manipulation">
              <Copy className="w-3.5 h-3.5" />
              העתק SQL ל-clipboard
            </button>
            <p className="text-rose-300/60 text-[0.65rem] font-medium leading-snug">
              אחרי שתריץ את ה-SQL — רענן את העמוד. ההודעה הזו תיעלם והרישומים החיים יופיעו ב"ממתינים".
            </p>
          </div>
        </div>
      )}

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DAYS.map(({ key, color, ring, bg }) => {
            const daySignups = signups.filter(s => s.day === key);
            return (
              <div key={key} className={`rounded-2xl bg-slate-900/70 ring-1 ${ring} overflow-hidden`}>
                <div className={`bg-gradient-to-l ${bg} px-4 py-3 flex items-center justify-between border-b border-white/8 gap-2`}>
                  <EditableHeader value={data.headers[key]} color={color} onChange={val => handleHeaderChange(key, val)} />
                  <button onClick={() => resetDay(key)} title="אפס לרשימת הקבועים"
                    className="grid place-items-center w-8 h-8 rounded-lg bg-slate-800/60 text-slate-500 hover:text-amber-400 active:scale-95 transition-all shrink-0">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Main 18 rows */}
                <div className="divide-y divide-white/5">
                  {data.rows[key].map((name, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                      <span className="text-ink-3 text-xs font-black tnum w-5 shrink-0 text-center">{i + 1}</span>
                      <input type="text" value={name} onChange={e => handleRowChange(key, i, e.target.value)}
                        placeholder="—"
                        className="flex-1 bg-transparent text-white text-sm font-bold placeholder:text-white/15 outline-none py-1 min-w-0" dir="rtl" />
                    </div>
                  ))}
                </div>

                {/* Waiting section */}
                <div className="border-t border-white/5 bg-slate-800/40">
                  <div className="px-3 py-2.5 text-ink-2 text-xs font-black tracking-wide flex items-center gap-2">
                    <Clock className="w-3 h-3 text-amber-400" />
                    <span>ממתינים</span>
                    {daySignups.length > 0 && (
                      <span className="grid place-items-center min-w-[20px] h-5 px-1.5 rounded-full bg-amber-500/20 ring-1 ring-amber-400/30 text-amber-300 text-[0.6rem] font-black tnum">
                        {daySignups.length}
                      </span>
                    )}
                  </div>

                  {/* Live signups from the SignupPage flow */}
                  <AnimatePresence>
                    {daySignups.map(signup => {
                      const busy = busyId === signup.id;
                      return (
                        <motion.div
                          key={signup.id}
                          layout
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -10 }}
                          className="px-3 py-2.5 bg-amber-500/8 border-t border-amber-400/15"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
                            <p className="flex-1 text-amber-200 text-sm font-black truncate">{signup.player_name}</p>
                            <button onClick={() => handleConfirmSignup(signup)} disabled={busy}
                              title="אשר הגעה ושלח פוש לשחקן"
                              className="grid place-items-center w-7 h-7 rounded-lg bg-emerald-500/20 ring-1 ring-emerald-500/30 text-emerald-300 active:scale-95 disabled:opacity-50 transition-all">
                              {busy
                                ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
                                : <CheckCircle2 className="w-3.5 h-3.5" />}
                            </button>
                            <button onClick={() => handleDeleteSignup(signup)} disabled={busy}
                              title="הסר רישום"
                              className="grid place-items-center w-7 h-7 rounded-lg bg-slate-700/60 ring-1 ring-white/8 text-slate-500 hover:text-rose-400 active:scale-95 disabled:opacity-50 transition-all">
                              <XIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {signup.note && (
                            <p className="text-slate-400 text-[0.7rem] font-medium leading-snug mt-1 pr-3.5">"{signup.note}"</p>
                          )}
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Manual editable waiting rows */}
                  <div className="divide-y divide-white/5">
                    {data.waiting[key].map((name, i) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                        <span className="w-5 shrink-0" />
                        <input type="text" value={name} onChange={e => handleWaitingChange(key, i, e.target.value)}
                          placeholder="—"
                          className="flex-1 bg-transparent text-slate-300 text-sm font-bold placeholder:text-white/10 outline-none py-1 min-w-0" dir="rtl" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
