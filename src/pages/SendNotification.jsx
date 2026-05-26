import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bell, CheckCircle2, AlertCircle, Users, ShieldCheck, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/lux';
import { supabase } from '@/lib/supabase';

const ADMIN_EMAIL = 'libermanasaf@gmail.com';

// Map a SendNotification URL to a lists_state day key (only DayList URLs)
const DAY_FROM_URL = {
  '/DayListSunday':    'sunday',
  '/DayListWednesday': 'wednesday',
  '/DayListThursday':  'thursday',
};
const DAY_LABELS = { sunday: 'יום ראשון', wednesday: 'יום רביעי', thursday: 'יום חמישי' };

// Build the WhatsApp message body for a given day from the cloud-synced list.
// Matches the Lists page 'copy' format: header, main names, ממתינים (if any), footer.
async function buildWhatsAppText(day) {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('lists_state')
    .select('data')
    .eq('id', 'main')
    .maybeSingle();
  if (error) return null;
  const all = data?.data || {};
  const header     = all.headers?.[day] || DAY_LABELS[day] || '';
  const mainNames  = (all.rows?.[day] || []).map(n => (n || '').trim()).filter(Boolean);
  const waitNames  = (all.waiting?.[day] || []).map(n => (n || '').trim()).filter(Boolean);
  const lines = [];
  if (header) lines.push(header, '');
  if (mainNames.length) {
    lines.push(...mainNames.map((name, i) => `${i + 1}. ${name}`));
  }
  if (waitNames.length) {
    if (mainNames.length) lines.push('');
    lines.push('ממתינים:', ...waitNames.map((name, i) => `${i + 1}. ${name}`));
  }
  lines.push('', 'ביטול אחרי 12:00 יחויב בתשלום');
  return lines.join('\n');
}

export default function SendNotification() {
  const [title, setTitle] = useState('סינתטיקו חולון');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/MatchDay');
  const [shareToWhatsApp, setShareToWhatsApp] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendingAdmin, setSendingAdmin] = useState(false);
  const [result, setResult] = useState(null); // { sent, failed }

  const dayForWhatsApp = DAY_FROM_URL[url] || null;
  const canShareToWhatsApp = !!dayForWhatsApp;

  const sendNotification = async (targetEmail = null) => {
    if (!body.trim()) {
      toast.error('יש להזין טקסט להודעה');
      return;
    }

    // Open the WhatsApp tab synchronously, before the await — so the popup
    // blocker treats it as a direct user gesture. We update its URL after
    // we've fetched the list text (or close it on failure).
    let waWin = null;
    if (shareToWhatsApp && canShareToWhatsApp) {
      waWin = window.open('about:blank', '_blank');
    }

    if (targetEmail) setSendingAdmin(true); else setSending(true);
    setResult(null);
    try {
      const res = await fetch('/api/send-notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim() || 'סינתטיקו חולון',
          body: body.trim(),
          url: url.trim() || '/',
          ...(targetEmail ? { targetEmail } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `שגיאת שרת ${res.status}`);
      setResult({ ...data, targetEmail });
      if (data.sent > 0) {
        toast.success(
          targetEmail
            ? `נשלח לאדמין (${data.sent} מכשיר/ים)`
            : `ההודעה נשלחה ל-${data.sent} מכשיר/ים`
        );
        if (!targetEmail) setBody('');
      } else {
        toast.warning(targetEmail ? 'לא נמצא מנוי פעיל לאדמין' : 'לא נמצאו מנויים פעילים');
      }

      // Push succeeded → now navigate the pre-opened tab to WhatsApp share URL
      if (waWin && dayForWhatsApp) {
        const text = await buildWhatsAppText(dayForWhatsApp);
        if (text) {
          waWin.location.href = `https://wa.me/?text=${encodeURIComponent(text)}`;
        } else {
          waWin.close();
          toast.error('לא ניתן לטעון את הרשימה ל-WhatsApp');
        }
      }
    } catch (e) {
      if (waWin) waWin.close();
      toast.error('שגיאה בשליחה', { description: e.message });
    }
    if (targetEmail) setSendingAdmin(false); else setSending(false);
  };

  const handleSend       = () => sendNotification();
  const handleSendAdmin  = () => sendNotification(ADMIN_EMAIL);

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
            <option value="/DayListSunday">רשימה — יום ראשון</option>
            <option value="/DayListWednesday">רשימה — יום רביעי</option>
            <option value="/DayListThursday">רשימה — יום חמישי</option>
            <option value="/MatchDay">סביבת המשחק</option>
            <option value="/PlayerHome">אזור אישי</option>
            <option value="/Podium">פודיום</option>
            <option value="/GameHistory">היסטוריית משחקים</option>
            <option value="/Statistics">סטטיסטיקות</option>
            <option value="/">עמוד הבית</option>
          </select>
        </div>

        {/* WhatsApp share toggle — only meaningful when sharing a day list */}
        {canShareToWhatsApp && (
          <label className="flex items-start gap-3 rounded-xl bg-emerald-500/8 ring-1 ring-emerald-500/25 px-3.5 py-3 cursor-pointer active:scale-[0.99] transition-transform">
            <input
              type="checkbox"
              checked={shareToWhatsApp}
              onChange={e => setShareToWhatsApp(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded accent-emerald-500 shrink-0 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-emerald-300 font-black text-sm">שלח גם ל-WhatsApp שלי</span>
              </div>
              <p className="text-emerald-400/70 text-[0.7rem] font-bold mt-1 leading-snug">
                אחרי שליחת הפוש — WhatsApp ייפתח בטאב חדש עם הרשימה המלאה כתובה. תבחר את הקבוצה שלך ותלחץ "שלח".
              </p>
            </div>
          </label>
        )}

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

        {/* Send button — to everyone */}
        <button
          onClick={handleSend}
          disabled={sending || sendingAdmin || !body.trim()}
          className="w-full flex items-center justify-center gap-2 min-h-[56px] rounded-xl st-foil font-black text-base shadow-[0_8px_22px_-8px_rgba(212,160,40,0.6)] active:scale-[0.98] hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
        >
          {sending ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
          {sending ? 'שולח...' : 'שלח פוש לכולם'}
        </button>

        {/* Admin-only send button — for testing */}
        <button
          onClick={handleSendAdmin}
          disabled={sending || sendingAdmin || !body.trim()}
          className="w-full flex items-center justify-center gap-2 min-h-[48px] rounded-xl bg-slate-800/80 ring-1 ring-amber-500/30 text-amber-300 font-black text-sm active:scale-[0.98] hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all touch-manipulation"
        >
          {sendingAdmin ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          {sendingAdmin ? 'שולח לאדמין...' : 'שלח פוש לאדמין בלבד (בדיקה)'}
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
