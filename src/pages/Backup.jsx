import React, { useState, useRef } from 'react';
import { Player, Round, Payment } from '@/api/entities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Upload, Shield, CheckCircle2, AlertTriangle, Loader2, FileJson, Trash2, Users, CalendarDays, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { PageHeader, StatTile, SectionTitle } from '@/components/ui/lux';

export default function Backup() {
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: players = [] } = useQuery({ queryKey: ['players'], queryFn: () => Player.list() });
  const { data: rounds = [] } = useQuery({ queryKey: ['rounds'], queryFn: () => Round.list() });
  const { data: payments = [] } = useQuery({ queryKey: ['payments'], queryFn: () => Payment.list() });

  const handleExport = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'סינתטיקו חולון',
      data: {
        players: players.map(({ id, name, rating, image, wins, appearances, created_date, updated_date }) => ({
          id, name, rating, image, wins, appearances, created_date, updated_date,
        })),
        rounds: rounds.map(({ id, date, teams, goalkeepers, openingTeams, winningTeam, teamWins, victoryPhoto, created_date, updated_date }) => ({
          id, date, teams, goalkeepers, openingTeams, winningTeam, teamWins, victoryPhoto, created_date, updated_date,
        })),
        payments: payments.map(({ id, roundId, roundDate, payments: pmts, pricePerPlayer, created_date, updated_date }) => ({
          id, roundId, roundDate, payments: pmts, pricePerPlayer, created_date, updated_date,
        })),
      },
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `synthetiko-backup-${format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: he })}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('הגיבוי יוצא בהצלחה!');
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
        const { players: p = [], rounds: r = [], payments: pm = [] } = parsed.data;
        setPendingData(parsed);
        setImportResult({ exportedAt: parsed.exportedAt, players: p.length, rounds: r.length, payments: pm.length });
        setConfirmRestore(true);
      } catch {
        toast.error('שגיאה בקריאת הקובץ — וודא שהקובץ תקין');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRestore = async () => {
    if (!pendingData) return;
    setImporting(true);
    setConfirmRestore(false);
    try {
      const { players: pData = [], rounds: rData = [], payments: pmData = [] } = pendingData.data;

      const [existingPlayers, existingRounds, existingPayments] = await Promise.all([
        Player.list(), Round.list(), Payment.list(),
      ]);

      await Promise.all([
        ...existingPlayers.map(p => Player.delete(p.id)),
        ...existingRounds.map(r => Round.delete(r.id)),
        ...existingPayments.map(p => Payment.delete(p.id)),
      ]);

      const playerIdMap = {};
      for (const p of pData) {
        const { id: oldId, created_date, updated_date, ...fields } = p;
        const created = await Player.create(fields);
        playerIdMap[oldId] = created.id;
      }

      const roundIdMap = {};
      for (const r of rData) {
        const { id: oldId, created_date, updated_date, ...fields } = r;
        const remappedTeams = (fields.teams || []).map(team => team.map(pid => playerIdMap[pid] || pid));
        const remappedGoalkeepers = {};
        if (fields.goalkeepers) {
          for (const [teamIdx, pid] of Object.entries(fields.goalkeepers)) {
            remappedGoalkeepers[teamIdx] = playerIdMap[pid] || pid;
          }
        }
        const created = await Round.create({ ...fields, teams: remappedTeams, goalkeepers: remappedGoalkeepers });
        roundIdMap[oldId] = created.id;
      }

      for (const pm of pmData) {
        const { id: oldId, created_date, updated_date, ...fields } = pm;
        const remappedPayments = {};
        if (fields.payments) {
          for (const [pid, paid] of Object.entries(fields.payments)) {
            remappedPayments[playerIdMap[pid] || pid] = paid;
          }
        }
        await Payment.create({
          ...fields,
          roundId: roundIdMap[fields.roundId] || fields.roundId,
          payments: remappedPayments,
        });
      }

      queryClient.invalidateQueries();
      toast.success('הגיבוי שוחזר בהצלחה! כל הנתונים הוחלפו.');
      setPendingData(null);
      setImportResult(null);
    } catch (err) {
      toast.error('שגיאה בשחזור — נסה שוב');
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
            ייצא את כל הנתונים — שחקנים, מחזורים ותשלומים — לקובץ JSON שניתן לשמור במחשב.
          </p>
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 min-h-[52px] rounded-xl bg-gradient-to-l from-emerald-500 to-emerald-700 text-white font-black text-base shadow-[0_8px_22px_-8px_rgba(16,185,129,0.6)] active:scale-[0.98] transition-transform"
          >
            <Download className="w-5 h-5" />
            הורד קובץ גיבוי
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
                { label: 'שחקנים', value: importResult.players, tone: 'text-emerald-300' },
                { label: 'מחזורים', value: importResult.rounds, tone: 'text-sky-300' },
                { label: 'תשלומים', value: importResult.payments, tone: 'text-amber-300' },
              ].map(({ label, value, tone }) => (
                <div key={label} className="rounded-xl bg-slate-900/80 ring-1 ring-white/8 p-2.5 text-center">
                  <p className={`tnum text-xl font-black ${tone}`}>{value}</p>
                  <p className="text-[0.66rem] text-ink-3 font-bold mt-0.5">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-rose-500/10 ring-1 ring-rose-500/25 rounded-xl px-3 py-2.5">
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="text-rose-200/90 text-xs font-bold leading-relaxed">
                כל {players.length} השחקנים, {rounds.length} המחזורים ו־{payments.length} התשלומים הנוכחיים יימחקו לצמיתות.
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
