import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bell, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/lux';

export default function SendNotification() {
  const [title, setTitle] = useState('סינתטיקו חולון');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/MatchDay');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null); // { sent, failed }

  const handleSend = async () => {
    if (!body.trim()) {
      toast.error('יש להזין טקסט להודעה');
      return;
    }
    setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'סינתטיקו חולון',
          body: body.trim(),
          url: url.trim() || '/',
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `שגיאת שרת ${res.status}`);
      setResult(data);
      if (data.sent > 0) {
        toast.success(`ההודעה נשלחה ל-${data.sent} מכשיר/ים`);
        setBody('');
      } else {
        toast.warning('לא נמצאו מנויים פעילים');
      }
    } catch (e) {
      toast.error('שגיאה בשליחה', { description: e.message });
    }
    setSending(false);
  };

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader
        icon={Bell}
        title="שלח התראות"
        subtitle="שליחת Push לכל השחקנים הרשומים"
        accent="amber"
      />

      <div className="p-4 max-w-lg mx-auto space-y-4">
        {/* Title */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-ink-2 tracking-wide">
            כותרת ההתראה
          </label>
          <input
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={64}
            placeholder="סינתטיקו חולון"
            className="w-full rounded-xl bg-slate-800/80 ring-1 ring-white/10 px-4 py-3 text-white text-sm font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-shadow"
          />
        </div>

        {/* Body */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-ink-2 tracking-wide">
            תוכן ההודעה <span className="text-rose-400">*</span>
          </label>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            maxLength={200}
            rows={4}
            placeholder="הקלד כאן את תוכן ההודעה..."
            className="w-full rounded-xl bg-slate-800/80 ring-1 ring-white/10 px-4 py-3 text-white text-sm font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-shadow resize-none leading-relaxed"
          />
          <p className="text-[0.62rem] text-ink-3 font-bold text-left tnum">
            {body.length}/200
          </p>
        </div>

        {/* URL */}
        <div className="space-y-1.5">
          <label className="block text-xs font-black text-ink-2 tracking-wide">
            קישור בלחיצה על ההתראה
          </label>
          <select
            value={url}
            onChange={e => setUrl(e.target.value)}
            className="w-full rounded-xl bg-slate-800/80 ring-1 ring-white/10 px-4 py-3 text-white text-sm font-bold focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-shadow cursor-pointer"
          >
            <option value="/MatchDay">סביבת המשחק</option>
            <option value="/PlayerHome">אזור אישי</option>
            <option value="/Podium">פודיום</option>
            <option value="/GameHistory">היסטוריית משחקים</option>
            <option value="/Statistics">סטטיסטיקות</option>
            <option value="/">עמוד הבית</option>
          </select>
        </div>

        {/* Preview */}
        {(title.trim() || body.trim()) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl bg-slate-800/60 ring-1 ring-white/8 p-4"
          >
            <p className="text-[0.62rem] font-black text-ink-3 tracking-wider mb-2">תצוגה מקדימה</p>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 ring-1 ring-amber-500/30 flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-black text-sm leading-tight truncate">
                  {title.trim() || 'סינתטיקו חולון'}
                </p>
                <p className="text-slate-300 text-xs leading-snug mt-0.5 line-clamp-2">
                  {body.trim() || '...'}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={sending || !body.trim()}
          className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-xl st-foil font-black text-base shadow-[0_8px_22px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {sending ? 'שולח...' : 'שלח פוש לכולם'}
        </button>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0 }}
              className={`rounded-2xl p-4 flex items-center gap-3 ring-1 ${
                result.sent > 0
                  ? 'bg-emerald-900/40 ring-emerald-500/30'
                  : 'bg-slate-800/60 ring-white/8'
              }`}
            >
              {result.sent > 0 ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-6 h-6 text-slate-400 shrink-0" />
              )}
              <div>
                <p className="text-white font-black text-sm">
                  {result.sent > 0 ? `נשלח בהצלחה ל-${result.sent} מכשיר/ים` : 'אין מנויים פעילים'}
                </p>
                {result.failed > 0 && (
                  <p className="text-slate-400 text-xs font-bold mt-0.5">
                    {result.failed} נכשלו (מנויים שפגו)
                  </p>
                )}
              </div>
              <div className="mr-auto flex items-center gap-1 text-ink-3">
                <Users className="w-4 h-4" />
                <span className="text-xs font-black tnum">{result.sent + result.failed}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
