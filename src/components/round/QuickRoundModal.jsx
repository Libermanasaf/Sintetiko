import React, { useState } from 'react';
import { X, Zap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-lg shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 rounded-xl">
              <Zap className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">יצירת מחזור מהיר</h2>
              <p className="text-xs text-slate-500">3 קבוצות • 6 שחקנים כ"א</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Textarea */}
        <div className="px-5 pb-3">
          <p className="text-sm text-slate-500 mb-2">הדבק רשימת שמות שחקנים, שם אחד בכל שורה:</p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={"ישראל ישראלי\nמשה כהן\nדוד לוי\n..."}
            className="w-full h-64 p-4 border-2 border-slate-200 rounded-2xl text-sm text-slate-800 resize-none focus:outline-none focus:border-emerald-400 bg-slate-50 leading-relaxed"
            autoFocus
          />
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-slate-400">{names.length} שמות זוהו</span>
            {names.length > 0 && names.length !== 18 && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                מצופה 18 שחקנים
              </span>
            )}
            {names.length === 18 && (
              <span className="text-xs text-emerald-600 font-medium">✓ מושלם!</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-5 pb-6 flex gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ביטול
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={names.length === 0}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            <Zap className="w-4 h-4 ml-1" />
            צור מחזור
          </Button>
        </div>
      </div>
    </div>
  );
}