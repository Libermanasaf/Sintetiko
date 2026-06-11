import React, { useState, useRef } from 'react';
import { Player, Round, Payment } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Upload, Shield, CheckCircle2, AlertTriangle, Loader2, FileJson, Users, CalendarDays, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { PageHeader, StatTile, SectionTitle } from '@/components/ui/lux';

// Every table we back up. `restore: false` means it's captured in the export
// for safekeeping but NOT written back on restore — push_subscriptions are
// device-bound and per-user RLS blocks the admin from writing others' rows.
const BACKUP_TABLES = [
  { name: 'players', restore: true },
  { name: 'rounds', restore: true },
  { name: 'payments', restore: true },
  { name: 'player_ratings', restore: true },
  { name: 'signups', restore: true },
  { name: 'lists_state', restore: true },
  { name: 'round_bets', restore: true },
  { name: 'push_subscriptions', restore: false },
];

export default function Backup() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  // Backup must capture EVERY row — opt out of the default list cap with 'all'.
  const { data: players = [] } = useQuery({ queryKey: ['players-all'], queryFn: () => Player.list(null, 'all') });
  const { data: rounds = [] } = useQuery({ queryKey: ['rounds-all'], queryFn: () => Round.list(null, 'all') });
  const { data: payments = [] } = useQuery({ queryKey: ['payments-all'], queryFn: () => Payment.list(null, 'all') });

  const [exporting, setExporting] = useState(false);

  // Full export: pull EVERY table straight from Supabase (not just the three
  // loaded into the page), so the backup captures ratings, signups, lists, etc.
  const handleExport = async () => {
    if (!supabase) { toast.error('Supabase לא מחובר'); return; }
    setExporting(true);
    try {
      const data = {};
      for (const { name } of BACKUP_TABLES) {
        const { data: rows, error } = await supabase.from(name).select('*');
        if (error) throw new Error(`${name}: ${error.message}`);
        data[name] = rows || [];
      }

      const backup = {
        version: '2.0-full',
        exportedAt: new Date().toISOString(),
        appName: 'סינתטיקו חולון',
        data,
      };

      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `synthetiko-backup-${format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: he })}.json`;
      a.click();
      URL.revokeObjectURL(url);
      const total = Object.values(data).reduce((n, arr) => n + arr.length, 0);
      toast.success(`הגיבוי יוצא בהצלחה! (${total} רשומות מ-${BACKUP_TABLES.length} טבלאות)`);
    } catch (err) {
      console.error('[backup export]', err);
      toast.error('שגיאה בייצוא הגיבוי', { description: err.message });
    } finally {
      setExporting(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target.result);
        if (!parsed.version || !parsed.data) {
          toast.error('קובץ לא תקין — לא נוצר על ידי המערכת');
          return;
        }
        // Per-table counts for the confirm modal (works for old 1.0 and new 2.0).
        const counts = {};
        for (const { name } of BACKUP_TABLES) counts[name] = (parsed.data[name] || []).length;
        setPendingData(parsed);
        setImportResult({ exportedAt: parsed.exportedAt, counts });
        setConfirmRestore(true);
      } catch {
        toast.error('שגיאה בקריאת הקובץ — וודא שהקובץ תקין');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Restore by upserting each row under its ORIGINAL id (the backup preserves
  // ids, and all foreign keys reference those ids — so no remapping needed).
  // upsert = insert-or-replace, so existing rows are overwritten and missing
  // ones added; we don't delete first, which is safer if a write fails midway.
  // push_subscriptions is skipped (device-bound + per-user RLS blocks the admin).
  const handleRestore = async () => {
    if (!pendingData || !supabase) return;
    setImporting(true);
    setConfirmRestore(false);
    try {
      let restored = 0;
      const skipped = [];
      for (const { name, restore } of BACKUP_TABLES) {
        if (!restore) continue;
        const rows = pendingData.data[name];
        if (!Array.isArray(rows) || rows.length === 0) continue; // table absent in old backups

        // Upsert in chunks so a huge table (e.g. player_ratings) doesn't hit
        // payload limits. onConflict 'id' replaces rows that already exist.
        const CHUNK = 200;
        for (let i = 0; i < rows.length; i += CHUNK) {
          const batch = rows.slice(i, i + CHUNK);
          const { error } = await supabase.from(name).upsert(batch, { onConflict: 'id' });
          if (error) {
            // Don't abort the whole restore — record which table failed and move on.
            console.error(`[restore] ${name}:`, error.message);
            skipped.push(`${name} (${error.message})`);
            break;
          }
        }
        if (!skipped.some(s => s.startsWith(name))) restored += rows.length;
      }

      queryClient.invalidateQueries();
      if (skipped.length) {
        toast.warning(`שוחזרו ${restored} רשומות. נכשלו: ${skipped.join('; ')}`, { duration: 9000 });
      } else {
        toast.success(`הגיבוי שוחזר בהצלחה! ${restored} רשומות שוחזרו.`);
      }
      setPendingData(null);
      setImportResult(null);
    } catch (err) {
      toast.error('שגיאה בשחזור — נסה שוב', { description: err.message });
      console.error(err);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="pb-10">
      <PageHeader icon={Shield} title="גיבוי ושחזור" subtitle="ייצוא ושחזור נתוני המועדון" accent="emerald" />

      <div className="p-4 space-y-5">
        {/* Current data */}
        <div>
          <SectionTitle className="mb-3">נתונים נוכחיים במערכת</SectionTitle>
          <div className="grid grid-cols-3 gap-2.5">
            <StatTile icon={Users} value={players.length} label="שחקנים" tone="pitch" />
            <StatTile icon={CalendarDays} value={rounds.length} label="מחזורים" tone="sky" />
            <StatTile icon={CreditCard} value={payments.length} label="תשלומים" tone="gold" />
          </div>
        </div>

        {/* Export */}
        <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/8 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Download className="w-4 h-4 text-emerald-400" strokeWidth={2.4} />
            <h2 className="font-black text-white">ייצוא גיבוי</h2>
          </div>
          <p className="text-ink-2 text-sm font-medium leading-relaxed">
            ייצא את כל הנתונים — שחקנים, מחזורים, תשלומים, דירוגים, הרשמות ורשימות — לקובץ JSON שניתן לשמור במחשב.
          </p>
          <button
            onClick={handleExport}
            disabled={exporting}
            className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-700 text-white font-black text-base shadow-[0_8px_22px_-8px_rgba(16,185,129,0.6)] active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {exporting ? (
              <><Loader2 className="w-5 h-5 animate-spin" />מייצא את כל הטבלאות...</>
            ) : (
              <><Download className="w-5 h-5" />הורד קובץ גיבוי</>
            )}
          </button>
        </div>

        {/* Import */}
        <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/8 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-amber-400" strokeWidth={2.4} />
            <h2 className="font-black text-white">שחזור מגיבוי</h2>
          </div>
          <div className="flex items-start gap-2.5 bg-amber-500/10 ring-1 ring-amber-500/25 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-amber-200/90 text-xs font-bold leading-relaxed">
              שחזור יחליף את <strong>כל הנתונים הקיימים</strong> בנתוני הגיבוי. פעולה זו אינה הפיכה.
            </p>
          </div>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-xl ring-1 ring-amber-500/40 bg-amber-500/10 text-amber-300 font-black text-base active:scale-[0.98] transition-transform disabled:opacity-60"
          >
            {importing ? (
              <><Loader2 className="w-5 h-5 animate-spin" />משחזר נתונים...</>
            ) : (
              <><FileJson className="w-5 h-5" />בחר קובץ גיבוי</>
            )}
          </button>
        </div>
      </div>

      {/* Confirm restore modal */}
      {confirmRestore && importResult && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm rounded-3xl bg-stadium-2 ring-1 ring-amber-500/20 p-6 space-y-4 shadow-2xl mb-[env(safe-area-inset-bottom)]"
          >
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-11 h-11 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/30">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white">אישור שחזור</h3>
            </div>

            <p className="text-ink-2 text-sm font-medium leading-relaxed">
              נמצא גיבוי מתאריך{' '}
              <span className="text-white font-black tnum">
                {format(new Date(importResult.exportedAt), 'dd/MM/yyyy בשעה HH:mm')}
              </span>
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'שחקנים', key: 'players', tone: 'text-emerald-300' },
                { label: 'מחזורים', key: 'rounds', tone: 'text-sky-300' },
                { label: 'תשלומים', key: 'payments', tone: 'text-amber-300' },
                { label: 'דירוגים', key: 'player_ratings', tone: 'text-fuchsia-300' },
                { label: 'הרשמות', key: 'signups', tone: 'text-teal-300' },
                { label: 'רשימות', key: 'lists_state', tone: 'text-indigo-300' },
              ].map(({ label, key, tone }) => (
                <div key={key} className="rounded-xl bg-slate-900/80 ring-1 ring-white/8 p-2.5 text-center">
                  <p className={`tnum text-xl font-black ${tone}`}>{importResult.counts?.[key] ?? 0}</p>
                  <p className="text-[0.66rem] text-ink-3 font-bold mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-amber-500/10 ring-1 ring-amber-500/25 rounded-xl px-3 py-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-amber-200/90 text-xs font-bold leading-relaxed">
                רשומות קיימות יוחלפו בערכים מהגיבוי (לפי מזהה). רשומות שנוספו אחרי הגיבוי יישארו. התראות Push לא משוחזרות.
              </p>
            </div>

            <div className="flex gap-2.5 pt-1">
              <button
                onClick={() => { setConfirmRestore(false); setPendingData(null); setImportResult(null); }}
                className="flex-1 min-h-[50px] rounded-xl bg-slate-800 ring-1 ring-white/10 text-slate-300 font-black active:scale-[0.98] transition-transform"
              >
                ביטול
              </button>
              <button
                onClick={handleRestore}
                className="flex-1 flex items-center justify-center gap-1.5 min-h-[50px] rounded-xl bg-gradient-to-l from-rose-500 to-rose-700 text-white font-black active:scale-[0.98] transition-transform"
              >
                <CheckCircle2 className="w-5 h-5" />
                שחזר עכשיו
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
