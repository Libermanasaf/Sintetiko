import React, { useState, useCallback, useRef } from 'react';
import { ClipboardList, Trash2, Pencil, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/lux';

const ROWS = 18;
const WAITING_ROWS = 6;

const DAYS = [
  { key: 'sunday',    color: 'text-amber-300',   ring: 'ring-amber-400/30',   bg: 'from-amber-500/15 to-amber-600/5',   defaultLabel: 'יום ראשון' },
  { key: 'wednesday', color: 'text-blue-300',     ring: 'ring-blue-400/30',    bg: 'from-blue-500/15 to-blue-600/5',     defaultLabel: 'יום רביעי' },
  { key: 'thursday',  color: 'text-emerald-300',  ring: 'ring-emerald-400/30', bg: 'from-emerald-500/15 to-emerald-600/5', defaultLabel: 'יום חמישי' },
];

const STORAGE_KEY = 'sintetiko_lists';

function getDefaults() {
  return {
    headers: { sunday: 'יום ראשון', wednesday: 'יום רביעי', thursday: 'יום חמישי' },
    rows: {
      sunday:    Array(ROWS).fill(''),
      wednesday: Array(ROWS).fill(''),
      thursday:  Array(ROWS).fill(''),
    },
    waiting: {
      sunday:    Array(WAITING_ROWS).fill(''),
      wednesday: Array(WAITING_ROWS).fill(''),
      thursday:  Array(WAITING_ROWS).fill(''),
    },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.rows && parsed.headers && parsed.waiting) return parsed;
    }
  } catch {}
  return getDefaults();
}

function persist(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

function EditableHeader({ value, color, onChange }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const commit = () => {
    const trimmed = draft.trim() || value;
    onChange(trimmed);
    setEditing(false);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter') commit();
    if (e.key === 'Escape') setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5 flex-1 min-w-0">
        <input
          ref={inputRef}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={onKeyDown}
          className={`flex-1 min-w-0 bg-transparent font-black text-base ${color} outline-none border-b border-current`}
          dir="rtl"
        />
        <button onClick={commit} className={`shrink-0 ${color} active:scale-95`}>
          <Check className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={startEdit}
      className={`flex items-center gap-1.5 font-black text-base ${color} active:opacity-70 transition-opacity group`}
    >
      {value}
      <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </button>
  );
}

export default function Lists() {
  const [data, setData] = useState(load);

  const handleRowChange = useCallback((day, idx, value) => {
    setData(prev => {
      const next = {
        ...prev,
        rows: { ...prev.rows, [day]: prev.rows[day].map((v, i) => i === idx ? value : v) },
      };
      persist(next);
      return next;
    });
  }, []);

  const handleWaitingChange = useCallback((day, idx, value) => {
    setData(prev => {
      const next = {
        ...prev,
        waiting: { ...prev.waiting, [day]: prev.waiting[day].map((v, i) => i === idx ? value : v) },
      };
      persist(next);
      return next;
    });
  }, []);

  const handleHeaderChange = useCallback((day, value) => {
    setData(prev => {
      const next = { ...prev, headers: { ...prev.headers, [day]: value } };
      persist(next);
      return next;
    });
  }, []);

  const clearDay = useCallback((day) => {
    setData(prev => {
      const next = {
        ...prev,
        rows: { ...prev.rows, [day]: Array(ROWS).fill('') },
        waiting: { ...prev.waiting, [day]: Array(WAITING_ROWS).fill('') },
      };
      persist(next);
      return next;
    });
  }, []);

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader icon={ClipboardList} title="רשימות" subtitle="רשימות נוכחות לפי יום" accent="amber" />

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DAYS.map(({ key, color, ring, bg }) => (
            <div key={key} className={`rounded-2xl bg-slate-900/70 ring-1 ${ring} overflow-hidden`}>
              {/* Header */}
              <div className={`bg-gradient-to-l ${bg} px-4 py-3 flex items-center justify-between border-b border-white/8 gap-2`}>
                <EditableHeader
                  value={data.headers[key]}
                  color={color}
                  onChange={val => handleHeaderChange(key, val)}
                />
                <button
                  onClick={() => clearDay(key)}
                  title={`נקה ${data.headers[key]}`}
                  className="grid place-items-center w-8 h-8 rounded-lg bg-slate-800/60 text-slate-500 hover:text-rose-400 active:scale-95 transition-all shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Main List */}
              <div className="divide-y divide-white/5">
                {data.rows[key].map((name, i) => (
                  <div key={`main-${i}`} className="flex items-center gap-3 px-3 py-1.5">
                    <span className="text-ink-3 text-xs font-black tnum w-5 shrink-0 text-center">{i + 1}</span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => handleRowChange(key, i, e.target.value)}
                      placeholder="—"
                      className="flex-1 bg-transparent text-white text-sm font-bold placeholder:text-white/15 outline-none py-1 min-w-0"
                      dir="rtl"
                    />
                  </div>
                ))}
              </div>

              {/* Waiting Section */}
              <div className="border-t border-white/5 bg-slate-800/40">
                <div className="px-3 py-2.5 text-ink-2 text-xs font-black tracking-wide flex items-center gap-2">
                  <span className="w-5 shrink-0" />
                  <span>ממתינים</span>
                </div>
                <div className="divide-y divide-white/5">
                  {data.waiting[key].map((name, i) => (
                    <div key={`waiting-${i}`} className="flex items-center gap-3 px-3 py-1.5">
                      <span className="text-ink-3 text-xs font-black tnum w-5 shrink-0 text-center" />
                      <input
                        type="text"
                        value={name}
                        onChange={e => handleWaitingChange(key, i, e.target.value)}
                        placeholder="—"
                        className="flex-1 bg-transparent text-slate-300 text-sm font-bold placeholder:text-white/10 outline-none py-1 min-w-0"
                        dir="rtl"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
