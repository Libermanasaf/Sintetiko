import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, ClipboardPaste, RotateCcw, Pencil, Check, CheckCircle2, X as XIcon, Clock, AlertTriangle, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/lux';
import { Signup, Player } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { addConfirmedToPublished } from '@/lib/listPublish';

const SIGNUPS_TABLE_SQL = `CREATE TABLE IF NOT EXISTS signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id TEXT,
  player_name TEXT NOT NULL,
  user_email TEXT NOT NULL,
  day TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'waiting',
  created_date TIMESTAMPTZ DEFAULT NOW(),
  updated_date TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE signups DISABLE ROW LEVEL SECURITY;
-- If the table already existed with player_id as UUID, run also:
ALTER TABLE signups ALTER COLUMN player_id TYPE TEXT;

-- Cloud-synced lists state (so names persist across devices and browser clears)
CREATE TABLE IF NOT EXISTS lists_state (
  id TEXT PRIMARY KEY,
  data JSONB DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE lists_state DISABLE ROW LEVEL SECURITY;
INSERT INTO lists_state (id, data) VALUES ('main', '{}'::jsonb) ON CONFLICT (id) DO NOTHING;`;

const WAITING_ROWS = 6;

const DAY_LABELS = { sunday: 'יום ראשון', wednesday: 'יום רביעי', thursday: 'יום חמישי' };

const EMPTY_18 = Array(18).fill('');

const DEFAULTS = {
  headers: { sunday: 'יום ראשון', wednesday: 'יום רביעי', thursday: 'יום חמישי' },
  rows: {
    sunday:    [...EMPTY_18],
    wednesday: [...EMPTY_18],
    thursday:  [...EMPTY_18],
  },
};

const DAYS = [
  { key: 'sunday',    color: 'text-amber-300',   ring: 'ring-amber-400/30',   bg: 'from-amber-500/15 to-amber-600/5' },
  { key: 'wednesday', color: 'text-blue-300',     ring: 'ring-blue-400/30',    bg: 'from-blue-500/15 to-blue-600/5' },
  { key: 'thursday',  color: 'text-emerald-300',  ring: 'ring-emerald-400/30', bg: 'from-emerald-500/15 to-emerald-600/5' },
];

const STORAGE_KEY = 'sintetiko_lists_v3';

// Day-of-week (0=Sun..6=Sat) when each list auto-resets (day AFTER the game).
const RESET_RULES = {
  sunday:    1, // Mon → reset Sunday's list
  wednesday: 4, // Thu → reset Wednesday's list
  thursday:  5, // Fri → reset Thursday's list
};

// Most recent occurrence of `weekday` (at 00:00 local).
function lastWeekdayDate(weekday, now = new Date()) {
  const d = new Date(now);
  d.setDate(d.getDate() - ((d.getDay() - weekday + 7) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function emptyWaiting() {
  return { sunday: Array(WAITING_ROWS).fill(''), wednesday: Array(WAITING_ROWS).fill(''), thursday: Array(WAITING_ROWS).fill('') };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.rows && p.headers) {
        return { ...p, waiting: p.waiting || emptyWaiting(), lastReset: p.lastReset || {} };
      }
    }
  } catch {}
  return { ...DEFAULTS, waiting: emptyWaiting(), lastReset: {} };
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
  const [diag, setDiag] = useState({ status: 'checking', error: null, count: null });
  const [hydrated, setHydrated] = useState(false);
  const queryClient = useQueryClient();
  // Throttle "save failed" toast so rapid edits don't spam, and remember
  // whether we ever observed a successful cloud save in this session.
  const lastSaveErrorAtRef = useRef(0);

  // Probe Supabase signups table directly so we can show exactly what's wrong
  const probe = useCallback(async () => {
    if (!supabase) { setDiag({ status: 'no-supabase', error: null, count: null }); return; }
    setDiag(d => ({ ...d, status: 'checking' }));
    const { data: rows, error } = await supabase.from('signups').select('*');
    if (error) {
      setDiag({ status: 'error', error: error.message, count: null });
    } else {
      setDiag({ status: 'ok', error: null, count: (rows || []).length });
    }
  }, []);

  useEffect(() => { probe(); }, [probe]);

  // Cloud-synced state: fetch lists_state row so names survive new devices / cache clears.
  const { data: cloudState } = useQuery({
    queryKey: ['lists-state'],
    queryFn: async () => {
      if (!supabase) return null;
      const { data: row, error } = await supabase
        .from('lists_state')
        .select('data')
        .eq('id', 'main')
        .maybeSingle();
      if (error) {
        console.warn('[lists_state] fetch failed', error.message);
        return null;
      }
      return row?.data || null;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });

  // Save state to BOTH localStorage and Supabase. Fire-and-forget for the cloud
  // write so the UI stays instant; localStorage is the offline fallback.
  // Surfaces save failures as a throttled toast — no more silent data loss.
  const persistAll = useCallback((state) => {
    persist(state);
    if (!supabase) return;
    supabase
      .from('lists_state')
      .upsert(
        { id: 'main', data: state, updated_at: new Date().toISOString() },
        { onConflict: 'id' }
      )
      .then(({ error }) => {
        if (!error) { lastSaveErrorAtRef.current = 0; return; }
        console.warn('[lists_state] save failed', error.code, error.message);
        const now = Date.now();
        if (now - lastSaveErrorAtRef.current < 30_000) return;
        lastSaveErrorAtRef.current = now;
        const isRls = error.code === '42501' || /row.level security/i.test(error.message || '');
        toast.error('הרשימה לא נשמרה בענן', {
          description: isRls
            ? 'RLS חוסם — צריך להריץ SQL תיקון ב-Supabase'
            : (error.message || 'נסה לרענן'),
          duration: 7000,
        });
      });
  }, []);

  // Hydrate state from cloud once per mount; merge so we don't clobber unrelated keys.
  // Mark hydrated even when cloud has no data so the auto-reset can safely start saving.
  // If cloud is empty but localStorage has names, push them up (backfill recovery).
  useEffect(() => {
    if (hydrated) return;
    if (cloudState === undefined) return; // query still loading

    const cloudHasData = cloudState && (cloudState.rows || cloudState.waiting || cloudState.headers);
    if (cloudHasData) {
      setData(prev => ({
        ...prev,
        headers:   cloudState.headers   || prev.headers,
        rows:      cloudState.rows      || prev.rows,
        waiting:   cloudState.waiting   || prev.waiting,
        lastReset: cloudState.lastReset || prev.lastReset,
      }));
    } else {
      // Cloud empty — if local has names, push them up so we don't lose them.
      setData(prev => {
        const hasLocalNames =
          Object.values(prev.rows || {}).some(arr => arr.some(n => n && n.trim())) ||
          Object.values(prev.waiting || {}).some(arr => arr.some(n => n && n.trim()));
        if (hasLocalNames) persistAll(prev);
        return prev;
      });
    }
    setHydrated(true);
  }, [cloudState, hydrated, persistAll]);

  // Auto-reset rosters: trigger only when we cross a reset day.
  // Missing lastReset for a day means "treat now as just-reset" so
  // existing customizations are NOT wiped on first run.
  // Gated on `hydrated` so we never write empty state over fresh cloud data.
  useEffect(() => {
    if (!hydrated) return;
    const tick = async () => {
      const now = new Date();
      let resetDays = [];
      let stampedOnly = [];
      setData(prev => {
        const lastReset = { ...(prev.lastReset || {}) };
        const rows = { ...prev.rows };
        const waiting = { ...prev.waiting };
        let changed = false;
        resetDays = [];
        stampedOnly = [];

        for (const [day, weekday] of Object.entries(RESET_RULES)) {
          if (!lastReset[day]) {
            // First time — stamp NOW, do NOT reset existing data
            lastReset[day] = now.toISOString();
            stampedOnly.push(day);
            changed = true;
            continue;
          }
          const trigger = lastWeekdayDate(weekday, now);
          if (new Date(lastReset[day]) < trigger) {
            rows[day] = [...DEFAULTS.rows[day]];
            waiting[day] = Array(WAITING_ROWS).fill('');
            lastReset[day] = now.toISOString();
            resetDays.push(day);
            changed = true;
          }
        }

        if (!changed) return prev;
        const next = { ...prev, rows, waiting, lastReset };
        persistAll(next);
        return next;
      });

      if (resetDays.length > 0) {
        if (supabase) {
          for (const day of resetDays) {
            try { await supabase.from('signups').delete().eq('day', day); }
            catch (e) { console.warn('[auto-reset] delete signups failed', day, e); }
          }
          queryClient.invalidateQueries({ queryKey: ['signups'] });
        }
        const labels = resetDays.map(d => DAY_LABELS[d]).join(', ');
        toast.info(`רשימת ${labels} אופסה אוטומטית לקבועים`);
      }
    };

    tick();
    const id = setInterval(tick, 30 * 60 * 1000); // every 30 min
    return () => clearInterval(id);
  }, [queryClient, hydrated]);

  // Live signups from the SignupPage flow
  const { data: signups = [], refetch: refetchSignups } = useQuery({
    queryKey: ['signups'],
    queryFn: () => Signup.list('-created_date'),
    staleTime: 15_000,
    refetchInterval: 30000,
  });
  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
  });

  const refresh = () => { probe(); refetchSignups(); };

  const copySQL = async () => {
    try {
      await navigator.clipboard.writeText(SIGNUPS_TABLE_SQL);
      toast.success('ה-SQL הועתק! הדבק ב-Supabase SQL Editor');
    } catch {
      toast.error('לא ניתן להעתיק — סמן ידנית');
    }
  };

  const copyDayList = async (day) => {
    const header = data.headers[day] || '';
    const mainNames    = data.rows[day].map(n => (n || '').trim()).filter(Boolean);
    const manualWait   = (data.waiting?.[day] || []).map(n => (n || '').trim()).filter(Boolean);
    const liveSignups  = signups.filter(s => s.day === day).map(s => (s.player_name || '').trim()).filter(Boolean);
    const allWaiting   = [...liveSignups, ...manualWait];

    const lines = [];
    if (header) lines.push(header, '');
    if (mainNames.length) {
      lines.push(...mainNames.map((name, i) => `${i + 1}. ${name}`));
    }
    if (allWaiting.length) {
      if (mainNames.length) lines.push('');
      lines.push('ממתינים:', ...allWaiting.map((name, i) => `${i + 1}. ${name}`));
    }
    lines.push('', 'ביטול אחרי 12:00 יחויב בתשלום');

    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      toast.success('הרשימה הועתקה ללוח!');
    } catch {
      toast.error('לא ניתן להעתיק');
    }
  };

  // Parse a multi-line string into clean names: strips "1. ", "2)", etc.
  // Empty lines are dropped. Returns up to `limit` names.
  const parsePastedNames = (text, limit) =>
    text
      .split(/\r?\n/)
      .map(line => line.replace(/^\s*\d+\s*[.\)\-:]?\s*/, '').trim())
      .filter(Boolean)
      .slice(0, limit);

  // Button-triggered: reads the clipboard and fills the main 18 rows.
  const pasteDayList = async (day) => {
    if (!navigator.clipboard?.readText) {
      toast.error('הדפדפן לא תומך בקריאה מהלוח');
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text?.trim()) {
        toast.error('הלוח ריק');
        return;
      }
      const names = parsePastedNames(text, 18);
      if (names.length === 0) {
        toast.error('לא נמצאו שמות בלוח');
        return;
      }
      setData(prev => {
        const newRows = [...EMPTY_18];
        names.forEach((name, i) => { newRows[i] = name; });
        const next = { ...prev, rows: { ...prev.rows, [day]: newRows } };
        persistAll(next);
        return next;
      });
      toast.success(`הודבקו ${names.length} שמות לרשימה`);
    } catch (e) {
      toast.error('לא ניתן לקרוא מהלוח', { description: e?.message });
    }
  };

  // Inline paste-into-input: only intercepts multi-line pastes so single-name
  // pastes still work normally. Distributes from row 1 regardless of where pasted.
  const handleInputPaste = useCallback((day, kind, e) => {
    const text = e.clipboardData?.getData('text');
    if (!text || !text.includes('\n')) return;
    e.preventDefault();
    const limit = kind === 'rows' ? 18 : WAITING_ROWS;
    const names = parsePastedNames(text, limit);
    if (names.length === 0) return;
    setData(prev => {
      const newArr = Array(limit).fill('');
      names.forEach((name, i) => { newArr[i] = name; });
      const next = { ...prev, [kind]: { ...prev[kind], [day]: newArr } };
      persistAll(next);
      return next;
    });
    toast.success(`הודבקו ${names.length} שמות`);
  }, []);

  const handleRowChange = useCallback((day, idx, value) => {
    setData(prev => {
      const next = { ...prev, rows: { ...prev.rows, [day]: prev.rows[day].map((v, i) => i === idx ? value : v) } };
      persistAll(next); return next;
    });
  }, []);

  const handleWaitingChange = useCallback((day, idx, value) => {
    setData(prev => {
      const next = { ...prev, waiting: { ...prev.waiting, [day]: prev.waiting[day].map((v, i) => i === idx ? value : v) } };
      persistAll(next); return next;
    });
  }, []);

  const handleHeaderChange = useCallback((day, value) => {
    setData(prev => {
      const next = { ...prev, headers: { ...prev.headers, [day]: value } };
      persistAll(next); return next;
    });
  }, []);

  const resetDay = useCallback((day) => {
    setData(prev => {
      const next = { ...prev, rows: { ...prev.rows, [day]: [...DEFAULTS.rows[day]] }, waiting: { ...prev.waiting, [day]: Array(WAITING_ROWS).fill('') } };
      persistAll(next); return next;
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
        persistAll(next);
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

      // If this day was ALREADY published, the live-rows change above stays hidden
      // from everyone (they see the snapshot). So personalize: add this player to
      // the published snapshot's extraConfirmed, where only they (by email) will
      // see their name appended. If the day isn't published yet, this no-ops and
      // the name simply rides along on the next full publish.
      try {
        await addConfirmedToPublished(signup.day, { name: signup.player_name, email });
      } catch (e) { console.warn('[personalize confirm]', e); }

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

      {/* Diagnostics — shows whether Supabase signups table is reachable */}
      <div className="px-4 pt-2">
        <div className={`rounded-2xl ring-1 p-3 flex items-center gap-2 text-xs font-bold ${
          diag.status === 'ok' ? 'bg-emerald-900/25 ring-emerald-500/30 text-emerald-300'
          : diag.status === 'checking' ? 'bg-slate-800/60 ring-white/8 text-slate-400'
          : 'bg-rose-900/30 ring-rose-500/40 text-rose-200'
        }`}>
          {diag.status === 'checking' && <><div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" /><span>בודק חיבור ל-Supabase...</span></>}
          {diag.status === 'ok' && <><CheckCircle2 className="w-4 h-4" /><span>חיבור פעיל. {diag.count} רישומים בענן.</span></>}
          {diag.status === 'no-supabase' && <><AlertTriangle className="w-4 h-4" /><span>Supabase לא מוגדר</span></>}
          {diag.status === 'error' && <><AlertTriangle className="w-4 h-4 shrink-0" /><span className="flex-1 min-w-0 break-words">בעיה: {diag.error}</span></>}
          <button onClick={refresh} className="mr-auto grid place-items-center w-7 h-7 rounded-md bg-black/30 active:scale-95 transition-transform shrink-0" title="רענן">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {diag.status === 'error' && (
          <div className="mt-2 rounded-2xl bg-rose-900/30 ring-1 ring-rose-500/40 p-4 space-y-3">
            <p className="text-rose-200 font-black text-sm">לתקן: הרץ את ה-SQL הבא ב-Supabase</p>
            <p className="text-rose-300/80 text-xs font-medium leading-snug">
              אם הטבלה קיימת אבל יש שגיאת permission denied — ה-SQL הזה גם משבית RLS:
            </p>
            <pre className="rounded-lg bg-slate-950/70 ring-1 ring-white/10 p-3 text-[0.7rem] font-mono text-slate-300 overflow-x-auto" dir="ltr">{SIGNUPS_TABLE_SQL}</pre>
            <p className="text-rose-300/60 text-[0.65rem] font-medium leading-snug">
              אם הטבלה כבר קיימת אז ה-CREATE ייכשל — זה בסדר, החלק החשוב הוא הפקודה האחרונה (DISABLE ROW LEVEL SECURITY).
            </p>
            <button onClick={copySQL}
              className="w-full flex items-center justify-center gap-2 min-h-[40px] rounded-lg bg-rose-500/20 ring-1 ring-rose-500/40 text-rose-200 font-black text-xs active:scale-[0.98] transition-all touch-manipulation">
              <Copy className="w-3.5 h-3.5" />
              העתק SQL
            </button>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DAYS.map(({ key, color, ring, bg }) => {
            const daySignups = signups.filter(s => s.day === key);
            return (
              <div key={key} className={`rounded-2xl bg-slate-900/70 ring-1 ${ring} overflow-hidden`}>
                <div className={`bg-gradient-to-l ${bg} px-4 py-3 flex items-center justify-between border-b border-white/8 gap-2`}>
                  <EditableHeader value={data.headers[key]} color={color} onChange={val => handleHeaderChange(key, val)} />
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => pasteDayList(key)} title="הדבק רשימה מ-WhatsApp"
                      className="grid place-items-center w-8 h-8 rounded-lg bg-slate-800/60 text-slate-500 hover:text-blue-400 active:scale-95 transition-all">
                      <ClipboardPaste className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => copyDayList(key)} title="העתק רשימה ל-WhatsApp"
                      className="grid place-items-center w-8 h-8 rounded-lg bg-slate-800/60 text-slate-500 hover:text-emerald-400 active:scale-95 transition-all">
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => resetDay(key)} title="אפס לרשימת הקבועים"
                      className="grid place-items-center w-8 h-8 rounded-lg bg-slate-800/60 text-slate-500 hover:text-amber-400 active:scale-95 transition-all">
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main 18 rows */}
                <div className="divide-y divide-white/5">
                  {data.rows[key].map((name, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                      <span className="text-ink-3 text-xs font-black tnum w-5 shrink-0 text-center">{i + 1}</span>
                      <input type="text" value={name} onChange={e => handleRowChange(key, i, e.target.value)}
                        onPaste={e => handleInputPaste(key, 'rows', e)}
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
                          onPaste={e => handleInputPaste(key, 'waiting', e)}
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
