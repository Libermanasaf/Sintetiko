import React, { useState, useRef } from 'react';
import { Player, Round, Payment } from '@/api/entities';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Download, Upload, Shield, CheckCircle2, AlertTriangle, Loader2, FileJson, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

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

  // --- EXPORT ---
  const handleExport = () => {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      appName: 'סינתטיקו חולון',
      data: {
        players: players.map(({ id, name, rating, image, wins, appearances, created_date, updated_date }) => ({
          id, name, rating, image, wins, appearances, created_date, updated_date
        })),
        rounds: rounds.map(({ id, date, teams, goalkeepers, openingTeams, winningTeam, teamWins, victoryPhoto, created_date, updated_date }) => ({
          id, date, teams, goalkeepers, openingTeams, winningTeam, teamWins, victoryPhoto, created_date, updated_date
        })),
        payments: payments.map(({ id, roundId, roundDate, payments: pmts, pricePerPlayer, created_date, updated_date }) => ({
          id, roundId, roundDate, payments: pmts, pricePerPlayer, created_date, updated_date
        })),
      }
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

  // --- IMPORT / RESTORE ---
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
        setImportResult({
          exportedAt: parsed.exportedAt,
          players: p.length,
          rounds: r.length,
          payments: pm.length,
        });
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

      // Delete all existing data
      const [existingPlayers, existingRounds, existingPayments] = await Promise.all([
        Player.list(),
        Round.list(),
        Payment.list(),
      ]);

      await Promise.all([
        ...existingPlayers.map(p => Player.delete(p.id)),
        ...existingRounds.map(r => Round.delete(r.id)),
        ...existingPayments.map(p => Payment.delete(p.id)),
      ]);

      // Restore players and build ID mapping (old id -> new id)
      const playerIdMap = {};
      for (const p of pData) {
        const { id: oldId, created_date, updated_date, ...fields } = p;
        const created = await Player.create(fields);
        playerIdMap[oldId] = created.id;
      }

      // Restore rounds — remap player IDs inside teams & goalkeepers
      const roundIdMap = {};
      for (const r of rData) {
        const { id: oldId, created_date, updated_date, ...fields } = r;
        // Remap teams
        const remappedTeams = (fields.teams || []).map(team =>
          team.map(pid => playerIdMap[pid] || pid)
        );
        // Remap goalkeepers
        const remappedGoalkeepers = {};
        if (fields.goalkeepers) {
          for (const [teamIdx, pid] of Object.entries(fields.goalkeepers)) {
            remappedGoalkeepers[teamIdx] = playerIdMap[pid] || pid;
          }
        }
        const created = await Round.create({
          ...fields,
          teams: remappedTeams,
          goalkeepers: remappedGoalkeepers,
        });
        roundIdMap[oldId] = created.id;
      }

      // Restore payments — remap roundId and player IDs in payments map
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

  const statsNow = [
    { label: 'שחקנים', value: players.length, color: 'text-emerald-400' },
    { label: 'מחזורים', value: rounds.length, color: 'text-blue-400' },
    { label: 'תשלומים', value: payments.length, color: 'text-amber-400' },
  ];

  return (
    <div className="pb-28">
      {/* Sticky Header */}
      <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <Shield className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black text-white">גיבוי ושחזור</h1>
        </div>
      </div>

      <div className="p-4 space-y-5">
        {/* Current Data Summary */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">נתונים נוכחיים במערכת</h2>
          <div className="grid grid-cols-3 gap-3">
            {statsNow.map(({ label, value, color }) => (
              <div key={label} className="bg-slate-900/60 rounded-xl p-3 text-center border border-slate-700/40">
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Export */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Download className="w-4 h-4 text-emerald-400" />
            <h2 className="font-bold text-white">ייצוא גיבוי</h2>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed">
            יוצא את כל הנתונים (שחקנים, מחזורים, תשלומים) לקובץ JSON שניתן לשמור במחשב.
          </p>
          <Button
            onClick={handleExport}
            className="w-full h-12 text-base font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded-xl border border-emerald-500/40 touch-manipulation"
          >
            <Download className="w-5 h-5 ml-2" />
            הורד קובץ גיבוי
          </Button>
        </div>

        {/* Import */}
        <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Upload className="w-4 h-4 text-amber-400" />
            <h2 className="font-bold text-white">שחזור מגיבוי</h2>
          </div>
          <div className="flex items-start gap-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-300 text-xs leading-relaxed">
              שחזור יחליף את <strong>כל הנתונים הקיימים</strong> בנתוני הגיבוי. פעולה זו אינה הפיכה.
            </p>
          </div>
          <p className="text-slate-400 text-sm">
            בחר קובץ גיבוי שיוצא מהמערכת. כל הנתונים ישוחזרו במדויק.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={importing}
            variant="outline"
            className="w-full h-12 text-base font-bold border-amber-500/40 text-amber-400 hover:bg-amber-500/10 rounded-xl touch-manipulation"
          >
            {importing ? (
              <><Loader2 className="w-5 h-5 ml-2 animate-spin" />משחזר נתונים...</>
            ) : (
              <><FileJson className="w-5 h-5 ml-2" />בחר קובץ גיבוי</>
            )}
          </Button>
        </div>
      </div>

      {/* Confirm Restore Modal */}
      {confirmRestore && importResult && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm bg-slate-900 border border-slate-700 rounded-3xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 rounded-xl border border-amber-500/30">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-black text-white">אישור שחזור</h3>
            </div>

            <p className="text-slate-400 text-sm leading-relaxed">
              נמצא גיבוי מתאריך{' '}
              <span className="text-white font-semibold">
                {format(new Date(importResult.exportedAt), 'dd/MM/yyyy בשעה HH:mm')}
              </span>
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'שחקנים', value: importResult.players, color: 'text-emerald-400' },
                { label: 'מחזורים', value: importResult.rounds, color: 'text-blue-400' },
                { label: 'תשלומים', value: importResult.payments, color: 'text-amber-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-slate-800 rounded-xl p-2.5 text-center border border-slate-700">
                  <p className={`text-xl font-black ${color}`}>{value}</p>
                  <p className="text-xs text-slate-500">{label}</p>
                </div>
              ))}
            </div>

            <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2.5">
              <Trash2 className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-red-300 text-xs">
                כל {players.length} שחקנים, {rounds.length} מחזורים ו-{payments.length} תשלומים הנוכחיים יימחקו לצמיתות.
              </p>
            </div>

            <div className="flex gap-3 pt-1">
              <Button
                variant="outline"
                onClick={() => { setConfirmRestore(false); setPendingData(null); setImportResult(null); }}
                className="flex-1 h-12 border-slate-600 text-slate-300 rounded-xl touch-manipulation"
              >
                ביטול
              </Button>
              <Button
                onClick={handleRestore}
                className="flex-1 h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold rounded-xl border border-red-500/40 touch-manipulation"
              >
                <CheckCircle2 className="w-5 h-5 ml-2" />
                שחזר עכשיו
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}