import React, { useState, useCallback } from 'react';
import { ClipboardList, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/lux';

const DAYS = [
  { key: 'sunday',    label: 'יום ראשון',  color: 'text-amber-300',  ring: 'ring-amber-400/30',  bg: 'from-amber-500/15 to-amber-600/5' },
  { key: 'wednesday', label: 'יום רביעי',  color: 'text-blue-300',   ring: 'ring-blue-400/30',   bg: 'from-blue-500/15 to-blue-600/5' },
  { key: 'thursday',  label: 'יום חמישי',  color: 'text-emerald-300',ring: 'ring-emerald-400/30',bg: 'from-emerald-500/15 to-emerald-600/5' },
];
const ROWS = 18;

const STORAGE_KEY = 'sintetiko_lists';

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { sunday: Array(ROWS).fill(''), wednesday: Array(ROWS).fill(''), thursday: Array(ROWS).fill('') };
}

function save(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch {}
}

export default function Lists() {
  const [data, setData] = useState(load);

  const handleChange = useCallback((day, idx, value) => {
    setData(prev => {
      const next = { ...prev, [day]: prev[day].map((v, i) => i === idx ? value : v) };
      save(next);
      return next;
    });
  }, []);

  const clearDay = useCallback((day) => {
    setData(prev => {
      const next = { ...prev, [day]: Array(ROWS).fill('') };
      save(next);
      return next;
    });
  }, []);

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader icon={ClipboardList} title="רשימות" subtitle="רשימות נוכחות לפי יום" accent="amber" />

      <div className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {DAYS.map(({ key, label, color, ring, bg }) => (
            <div key={key} className={`rounded-2xl bg-slate-900/70 ring-1 ${ring} overflow-hidden`}>
              {/* Header */}
              <div className={`bg-gradient-to-l ${bg} px-4 py-3 flex items-center justify-between border-b border-white/8`}>
                <h2 className={`font-black text-base ${color}`}>{label}</h2>
                <button
                  onClick={() => clearDay(key)}
                  aria-label={`נקה רשימת ${label}`}
                  className="grid place-items-center w-8 h-8 rounded-lg bg-slate-800/60 text-slate-500 hover:text-rose-400 active:scale-95 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rows */}
              <div className="divide-y divide-white/5">
                {Array.from({ length: ROWS }, (_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-1.5">
                    <span className="text-ink-3 text-xs font-black tnum w-5 shrink-0 text-center">{i + 1}</span>
                    <input
                      type="text"
                      value={data[key][i]}
                      onChange={e => handleChange(key, i, e.target.value)}
                      placeholder="—"
                      className="flex-1 bg-transparent text-white text-sm font-bold placeholder:text-white/15 outline-none py-1 min-w-0"
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
