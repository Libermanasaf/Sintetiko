import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ClipboardList, Clock, User } from 'lucide-react';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';
import { supabase } from '@/lib/supabase';

const STORAGE_KEY = 'sintetiko_lists_v2';

const DAY_CONFIG = {
  sunday:    { label: 'יום ראשון',  color: 'text-amber-300',   ring: 'ring-amber-400/30',   bg: 'bg-amber-500/10',   dot: 'bg-amber-400' },
  wednesday: { label: 'יום רביעי',  color: 'text-blue-300',    ring: 'ring-blue-400/30',    bg: 'bg-blue-500/10',    dot: 'bg-blue-400' },
  thursday:  { label: 'יום חמישי',  color: 'text-emerald-300', ring: 'ring-emerald-400/30', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
};

const EMPTY_ROWS = Array(18).fill('');

function loadDay(day) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      if (p.rows && p.headers) {
        return {
          header: p.headers[day] || DAY_CONFIG[day].label,
          rows: p.rows[day] || EMPTY_ROWS,
        };
      }
    }
  } catch {}
  return {
    header: DAY_CONFIG[day].label,
    rows: EMPTY_ROWS,
  };
}

export default function DayListView({ day }) {
  const cfg = DAY_CONFIG[day];
  const [listData, setListData] = useState(() => loadDay(day));
  const [waitingSignups, setWaitingSignups] = useState([]);
  const [loadingSignups, setLoadingSignups] = useState(true);

  useEffect(() => {
    setListData(loadDay(day));
  }, [day]);

  useEffect(() => {
    if (!supabase) { setLoadingSignups(false); return; }
    supabase
      .from('signups')
      .select('id, player_name, created_date')
      .eq('day', day)
      .eq('status', 'waiting')
      .order('created_date', { ascending: true })
      .then(({ data }) => {
        setWaitingSignups(data || []);
        setLoadingSignups(false);
      });
  }, [day]);

  const filledRows = listData.rows.filter(n => n.trim());
  const emptyCount = listData.rows.filter(n => !n.trim()).length;

  return (
    <div className="pb-10">
      <PageHeader
        icon={ClipboardList}
        title={listData.header}
        subtitle={`${filledRows.length} שחקנים ברשימה`}
        accent={day === 'sunday' ? 'amber' : day === 'wednesday' ? 'sky' : 'emerald'}
      />

      <div className="p-4 space-y-4">
        {/* Roster */}
        <div className={`rounded-2xl ring-1 ${cfg.ring} overflow-hidden`}>
          <div className={`${cfg.bg} px-4 py-3 flex items-center gap-2`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
            <span className={`font-black text-sm ${cfg.color}`}>רשימה ראשית</span>
            <span className="text-slate-400 text-xs font-bold mr-auto">{filledRows.length} / {listData.rows.length}</span>
          </div>
          <div className="divide-y divide-white/5">
            {listData.rows.map((name, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: Math.min(idx * 0.015, 0.25) }}
                className={`flex items-center gap-3 px-4 py-3 ${!name.trim() ? 'opacity-30' : ''}`}
              >
                <span className={`text-xs font-black tnum w-6 text-center shrink-0 ${name.trim() ? cfg.color : 'text-slate-600'}`}>
                  {idx + 1}
                </span>
                {name.trim() ? (
                  <>
                    <div className={`grid place-items-center w-7 h-7 rounded-lg ${cfg.bg} ring-1 ${cfg.ring} shrink-0`}>
                      <User className={`w-3.5 h-3.5 ${cfg.color}`} strokeWidth={2.4} />
                    </div>
                    <span className="text-white font-bold text-sm">{name}</span>
                  </>
                ) : (
                  <span className="text-slate-600 text-sm font-medium">— מקום פנוי —</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Waiting list */}
        <div className="rounded-2xl ring-1 ring-white/8 overflow-hidden bg-slate-900/50">
          <div className="px-4 py-3 flex items-center gap-2 border-b border-white/5">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="font-black text-sm text-slate-300">ממתינים</span>
            {!loadingSignups && (
              <span className="text-slate-500 text-xs font-bold mr-auto">{waitingSignups.length} ממתינים</span>
            )}
          </div>
          {loadingSignups ? (
            <div className="p-4 space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-10 rounded-xl" />)}
            </div>
          ) : waitingSignups.length === 0 ? (
            <div className="px-4 py-6 text-center text-slate-500 text-sm font-medium">אין ממתינים כרגע</div>
          ) : (
            <div className="divide-y divide-white/5">
              {waitingSignups.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-3 px-4 py-3">
                  <span className="text-xs font-black tnum w-6 text-center text-slate-500 shrink-0">{idx + 1}</span>
                  <div className="grid place-items-center w-7 h-7 rounded-lg bg-slate-800 ring-1 ring-white/8 shrink-0">
                    <User className="w-3.5 h-3.5 text-slate-400" strokeWidth={2.4} />
                  </div>
                  <span className="text-slate-300 font-bold text-sm">{s.player_name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
