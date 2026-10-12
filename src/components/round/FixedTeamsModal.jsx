import React, { useState } from 'react';
import { X, ListChecks } from 'lucide-react';
import { parseRosterLines, matchRosterNames } from '@/lib/matchRosterNames';

// Index-aligned with the team colors everywhere else: 0=yellow, 1=blue, 2=orange.
const TEAMS = [
  { name: 'הצהובים', dot: 'bg-yellow-400', ring: 'focus:ring-yellow-400/60' },
  { name: 'הכחולים', dot: 'bg-sky-500', ring: 'focus:ring-sky-400/60' },
  { name: 'הכתומים', dot: 'bg-orange-500', ring: 'focus:ring-orange-400/60' },
];

// Teams decided ahead of time: the admin pastes each team's roster and the
// round is built exactly as given — no balancing.
export default function FixedTeamsModal({ players, onClose, onConfirm }) {
  const [texts, setTexts] = useState(['', '', '']);
  const names = texts.map(parseRosterLines);
  const total = names.reduce((s, n) => s + n.length, 0);
  const ready = names.every((n) => n.length > 0);

  const setText = (i, value) =>
    setTexts((prev) => prev.map((t, j) => (j === i ? value : t)));

  const handleConfirm = () => {
    // Match team by team, passing what earlier teams claimed so placeholders
    // ("שוער") get a distinct row per team and a player pasted twice is caught.
    const teams = [];
    const unmatched = [];
    const duplicates = [];
    for (const teamNames of names) {
      const res = matchRosterNames(teamNames, players, teams.flat());
      teams.push(res.matched);
      unmatched.push(...res.unmatched);
      duplicates.push(...res.duplicates);
    }
    onConfirm(teams, unmatched, duplicates);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4" dir="rtl" onClick={onClose}>
      <div
        className="w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-[0_-20px_60px_rgba(0,0,0,0.7)] overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col max-h-[calc(100dvh-var(--bottom-nav-h)-1rem)] sm:max-h-[92vh] mb-[var(--bottom-nav-h)] sm:mb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Gold hairline */}
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-sky-500/15 ring-1 ring-sky-500/30 shrink-0">
              <ListChecks className="w-5 h-5 text-sky-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black st-gold-text">קבוצות ידועות מראש</h2>
              <p className="text-[0.7rem] text-slate-400 font-bold">הקבוצות נשמרות בדיוק כמו שהדבקת</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="סגור"
            className="grid place-items-center w-9 h-9 rounded-lg bg-slate-800/80 text-slate-400 hover:text-white active:scale-95 transition-all touch-manipulation shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* One textarea per team */}
        <div className="px-5 py-4 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-400 font-bold">הדבק את שחקני כל קבוצה, שם אחד בכל שורה:</p>
          {TEAMS.map((team, i) => (
            <div key={team.name}>
              <div className="flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-2 text-sm font-black text-white">
                  <span className={`w-3 h-3 rounded-full ${team.dot}`} />
                  {team.name}
                </span>
                <span className="text-xs font-bold text-slate-500 tnum">{names[i].length} שחקנים</span>
              </div>
              <textarea
                value={texts[i]}
                onChange={(e) => setText(i, e.target.value)}
                placeholder={'ישראל ישראלי\nמשה כהן\n...'}
                rows={4}
                className={`w-full p-3 rounded-2xl bg-slate-800/90 ring-1 ring-white/10 text-white text-base sm:text-sm placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 ${team.ring} transition-shadow leading-relaxed`}
                dir="rtl"
                autoFocus={i === 0}
              />
            </div>
          ))}
          <span className="block text-xs font-bold text-slate-500 tnum">סה״כ {total} שחקנים</span>
        </div>

        {/* Actions — sticky footer */}
        <div className="px-5 pt-3 pb-4 flex gap-2.5 border-t border-white/8 bg-slate-950/95 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-300 font-black text-sm active:scale-95 transition-transform touch-manipulation"
          >
            ביטול
          </button>
          <button
            onClick={handleConfirm}
            disabled={!ready}
            className="flex-1 min-h-[48px] flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-sky-500 to-sky-600 text-white font-black text-sm shadow-[0_6px_18px_-6px_rgba(14,165,233,0.55)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-transform touch-manipulation"
          >
            <ListChecks className="w-4 h-4" />
            צור מחזור
          </button>
        </div>
      </div>
    </div>
  );
}
