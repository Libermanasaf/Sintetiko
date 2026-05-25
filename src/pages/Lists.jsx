import React, { useState, useCallback, useRef } from 'react';
import { ClipboardList, RotateCcw, Pencil, Check } from 'lucide-react';
import { PageHeader } from '@/components/ui/lux';

const DEFAULT_PLAYERS = [
  'גלעד עוזיאל', 'אריאל רביבו', 'יוסף משומר', 'אופיר אוחיון',
  'מאור חימי', 'אביחי שרה קאן', 'מתן גינאדי', 'יניב אזולאי',
  'תמיר אברהם', 'אלכס מור', 'ניב מזרחי', 'גל לוי',
  'גל דניאל', 'חן נצר', 'לירן לוי', 'מאור קאקולי',
  'בר ממן', 'דוד דסלין',
];

const DAYS = [
  { key: 'sunday',    color: 'text-amber-300',   ring: 'ring-amber-400/30',   bg: 'from-amber-500/15 to-amber-600/5',   defaultLabel: 'יום ראשון' },
  { key: 'wednesday', color: 'text-blue-300',     ring: 'ring-blue-400/30',    bg: 'from-blue-500/15 to-blue-600/5',     defaultLabel: 'יום רביעי' },
  { key: 'thursday',  color: 'text-emerald-300',  ring: 'ring-emerald-400/30', bg: 'from-emerald-500/15 to-emerald-600/5', defaultLabel: 'יום חמישי' },
];

const STORAGE_KEY = 'sintetiko_lists_v2';

function getDefaults() {
  return {
    headers: { sunday: 'יום ראשון', wednesday: 'יום רביעי', thursday: 'יום חמישי' },
    rows: {
      sunday:    [...DEFAULT_PLAYERS],
      wednesday: [...DEFAULT_PLAYERS],
      thursday:  [...DEFAULT_PLAYERS],
    },
  };
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.rows && parsed.headers) return parsed;
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

  const handleHeaderChange = useCallback((day, value) => {
    setData(prev => {
      const next = { ...prev, headers: { ...prev.headers, [day]: value } };
      persist(next);
      return next;
    });
  }, []);

  const resetDay = useCallback((day) => {
    setData(prev => {
      const next = { ...prev, rows: { ...prev.rows, [day]: [...DEFAULT_PLAYERS] } };
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
                  onClick={() => resetDay(key)}
                  title="אפס לרשימת הקבועים"
                  className="grid place-items-center w-8 h-8 rounded-lg bg-slate-800/60 text-slate-500 hover:text-amber-400 active:scale-95 transition-all shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                {data.rows[key].map((name, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                    <span className="text-ink-3 text-xs font-black tnum w-5 shrink-0 text-center">{i + 1}</span>
                    <input
                      type="text"
                      value={name}
                      onChange={e => handleRowChange(key, i, e.target.value)}
                      className="flex-1 bg-transparent text-white text-sm font-bold outline-none py-1 min-w-0"
                      dir="rtl"
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
