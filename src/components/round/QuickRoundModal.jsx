import React, { useState } from 'react';
import { X, Zap, AlertCircle } from 'lucide-react';

export default function QuickRoundModal({ players, onClose, onConfirm }) {
  const [text, setText] = useState('');

  const parseNames = () => {
    return text
      .split('\n')
      .map(line => line.trim())
      .map(line => line.replace(/^\d+[\.\)\-\s]+/, '').trim())
      .filter(line => line.length > 0);
  };

  const names = parseNames();

  const handleConfirm = () => {
    // Match names to players (case-insensitive, partial match)
    const matched = [];
    const unmatched = [];

    names.forEach(name => {
      const found = players.find(p =>
        p.name.toLowerCase().includes(name.toLowerCase()) ||
        name.toLowerCase().includes(p.name.toLowerCase())
      );
      if (found && !matched.find(m => m.id === found.id)) {
        matched.push(found);
      } else if (!found) {
        unmatched.push(name);
      }
    });

    onConfirm(matched, unmatched);
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
            <div className="grid place-items-center w-10 h-10 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/30 shrink-0">
              <Zap className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-black st-gold-text">יצירת מחזור מהיר</h2>
              <p className="text-[0.7rem] text-slate-400 font-bold">3 קבוצות • 6 שחקנים כ״א</p>
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

        {/* Textarea */}
        <div className="px-5 py-4 overflow-y-auto">
          <p className="text-xs text-slate-400 font-bold mb-2">הדבק רשימת שמות שחקנים, שם אחד בכל שורה:</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"ישראל ישראלי\nמשה כהן\nדוד לוי\n..."}
            className="w-full h-48 sm:h-64 p-4 rounded-2xl bg-slate-800/90 ring-1 ring-white/10 text-white text-sm placeholder:text-slate-600 resize-none focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-shadow leading-relaxed"
            dir="rtl"
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs font-bold text-slate-500 tnum">{names.length} שמות זוהו</span>
            {names.length > 0 && names.length !== 18 && (
              <span className="text-xs text-amber-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                מצופה 18 שחקנים
              </span>
            )}
            {names.length === 18 && (
              <span className="text-xs text-emerald-400 font-black">✓ מושלם!</span>
            )}
          </div>
        </div>

        {/* Actions — sticky footer. Modal already sits above the bottom nav
            (mb on the panel), so a plain pb-4 is enough here. */}
        <div className="px-5 pt-3 pb-4 flex gap-2.5 border-t border-white/8 bg-slate-950/95 shrink-0">
          <button
            onClick={onClose}
            className="flex-1 min-h-[48px] rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-300 font-black text-sm active:scale-95 transition-transform touch-manipulation"
          >
            ביטול
          </button>
          <button
            onClick={handleConfirm}
            disabled={names.length === 0}
            className="flex-1 min-h-[48px] flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-600 text-white font-black text-sm shadow-[0_6px_18px_-6px_rgba(16,185,129,0.55)] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-transform touch-manipulation"
          >
            <Zap className="w-4 h-4" />
            צור מחזור
          </button>
        </div>
      </div>
    </div>
  );
}