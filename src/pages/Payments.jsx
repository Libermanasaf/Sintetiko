import React, { useState, useMemo, useEffect } from 'react';
import { Round, Player, Payment } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, User, CheckCircle2, Circle, Save, Minus, Plus, BellRing, Check } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';
import { PageHeader } from '@/components/ui/lux';
import { callApi } from '@/lib/apiClient';

const DEFAULT_PRICE = 35;

export default function Payments() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [localPayments, setLocalPayments] = useState({});
  const [pricePerPlayer, setPricePerPlayer] = useState(DEFAULT_PRICE);
  // Payment-reminder pushes: who is sending now / who was reminded this visit.
  const [remindingId, setRemindingId] = useState(null);
  const [remindedIds, setRemindedIds] = useState(() => new Set());
  const queryClient = useQueryClient();

  const [bulkState, setBulkState] = useState('idle'); // idle | confirm | sending

  // Pushes one player a personal (by first name) reminder to pay for the
  // selected round. Returns 'sent' | 'no-account' | 'no-push'; throws on error.
  const pushReminder = async (player) => {
    if (!player.email) return 'no-account';
    const firstName = player.name.trim().split(/\s+/)[0];
    const dateLabel = format(new Date(selectedRound.date), 'd.M', { locale: he });
    const res = await callApi('/api/send-notification', {
      targetEmail: player.email,
      title: 'תזכורת תשלום 💰',
      body: `היי ${firstName}, נשמח שתעביר ₪${pricePerPlayer} על המשחק מ-${dateLabel}. תודה!`,
      url: '/PlayerHome',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
    if (data.sent > 0) {
      setRemindedIds((prev) => new Set(prev).add(player.id));
      return 'sent';
    }
    return 'no-push';
  };

  const sendReminder = async (player) => {
    setRemindingId(player.id);
    try {
      const r = await pushReminder(player);
      if (r === 'sent') toast.success(`נשלחה תזכורת ל${player.name} ✅`);
      else if (r === 'no-account') toast.error(`ל${player.name} אין חשבון מחובר באפליקציה`);
      else toast.warning(`לא נשלח — ל${player.name} אין התראות פעילות`);
    } catch (e) {
      toast.error('שליחת התזכורת נכשלה', { description: e.message });
    } finally {
      setRemindingId(null);
    }
  };

  // Everyone unpaid in this round, each with their own name. Sequential so a
  // big list doesn't fire 20 parallel serverless calls at once.
  const sendReminderToAll = async (unpaid) => {
    setBulkState('sending');
    const missed = [];
    let sent = 0;
    for (const p of unpaid) {
      try {
        if ((await pushReminder(p)) === 'sent') sent++;
        else missed.push(p.name);
      } catch {
        missed.push(p.name);
      }
    }
    setBulkState('idle');
    if (sent) toast.success(`נשלחה תזכורת ל-${sent} שחקנים ✅`);
    if (missed.length) {
      toast.warning(`לא נשלח ל-${missed.length}`, {
        description: `${missed.join(', ')} — אין חשבון או שההתראות כבויות`,
        duration: 8000,
      });
    }
  };

  const { data: rounds = [] } = useQuery({
    queryKey: ['rounds'],
    queryFn: () => Round.list('-date', 200),
  });
  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
  });
  const { data: paymentRecords = [] } = useQuery({
    queryKey: ['payments'],
    queryFn: () => Payment.list('-roundDate', 200),
  });

  const selectedRound = useMemo(() =>
    selectedDate ? rounds.find(r => isSameDay(new Date(r.date), selectedDate)) : null,
    [selectedDate, rounds]
  );
  const selectedPaymentRecord = useMemo(() =>
    selectedRound ? paymentRecords.find(p => p.roundId === selectedRound.id) : null,
    [selectedRound, paymentRecords]
  );

  useEffect(() => {
    if (selectedRound) {
      if (selectedPaymentRecord) {
        setLocalPayments(selectedPaymentRecord.payments || {});
        setPricePerPlayer(selectedPaymentRecord.pricePerPlayer || DEFAULT_PRICE);
      } else {
        const initial = {};
        (selectedRound.teams || []).flat().forEach(id => { initial[id] = false; });
        setLocalPayments(initial);
        setPricePerPlayer(DEFAULT_PRICE);
      }
    }
  }, [selectedRound?.id, selectedPaymentRecord?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRound) return;
      if (selectedPaymentRecord) {
        return Payment.update(selectedPaymentRecord.id, { payments: localPayments, pricePerPlayer });
      }
      return Payment.create({ roundId: selectedRound.id, roundDate: selectedRound.date, payments: localPayments, pricePerPlayer });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('תשלומים נשמרו בהצלחה!');
    },
  });

  const togglePayment = (playerId) => {
    setLocalPayments(prev => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  const sortedRounds = useMemo(() => [...rounds].sort((a, b) => new Date(a.date) - new Date(b.date)), [rounds]);
  const datesWithRounds = rounds.map(r => new Date(r.date));
  const CUTOFF_DATE = new Date('2026-04-30');
  const eligibleRounds = sortedRounds.slice(3).filter(r => new Date(r.date) > CUTOFF_DATE);
  const irrelevantDates = sortedRounds.slice(3).filter(r => new Date(r.date) <= CUTOFF_DATE).map(r => new Date(r.date));
  // A round is fully paid only when EVERY player in it has paid. Earlier this used
  // a hard-coded 18 (assuming 3×6 squads), which marked a 24-player round green at
  // 22 paid. Compare against the round's actual roster size instead.
  const rosterSize = (r) => (r.teams || []).flat().length;
  const paidCountFor = (r) => {
    const rec = paymentRecords.find(p => p.roundId === r.id);
    return rec ? Object.values(rec.payments || {}).filter(Boolean).length : 0;
  };
  const greenDates = eligibleRounds.filter(r => {
    const size = rosterSize(r);
    return size > 0 && paidCountFor(r) >= size;
  }).map(r => new Date(r.date));
  const redDates = eligibleRounds.filter(r => {
    const size = rosterSize(r);
    return size === 0 ? true : paidCountFor(r) < size;
  }).map(r => new Date(r.date));

  const roundPlayers = useMemo(() => {
    if (!selectedRound) return [];
    return (selectedRound.teams || []).flat().map(id => players.find(p => p.id === id)).filter(Boolean);
  }, [selectedRound, players]);

  const paidCount = roundPlayers.filter(p => localPayments[p.id]).length;
  const totalCollected = paidCount * pricePerPlayer;
  const totalExpected = roundPlayers.length * pricePerPlayer;

  return (
    <div className="pb-10">
      <PageHeader icon={CreditCard} title="תשלומים" subtitle="גביית דמי השתתפות" accent="amber" />

      <div className="p-4 space-y-4">
        {/* Calendar */}
        <div className="rounded-2xl p-3 bg-slate-900/60 ring-1 ring-white/8 overflow-hidden">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={he}
            className="mx-auto w-full"
            modifiers={{ hasRound: datesWithRounds, paid: [...greenDates, ...irrelevantDates], unpaid: redDates }}
            modifiersStyles={{
              hasRound: { fontWeight: 'bold', textDecoration: 'underline' },
              paid: { color: '#4ade80', fontWeight: 'bold' },
              unpaid: { color: '#f87171', fontWeight: 'bold' },
            }}
          />
        </div>

        {!selectedDate && (
          <div className="text-center py-9 rounded-2xl bg-slate-900/40 ring-1 ring-white/5">
            <CreditCard className="w-9 h-9 text-slate-600 mx-auto mb-2" strokeWidth={1.8} />
            <p className="text-ink-3 text-sm font-bold">בחר תאריך מחזור מלוח השנה</p>
          </div>
        )}

        {selectedDate && !selectedRound && (
          <div className="text-center py-9 rounded-2xl bg-slate-900/40 ring-1 ring-white/5">
            <CreditCard className="w-9 h-9 text-slate-600 mx-auto mb-2" strokeWidth={1.8} />
            <p className="text-ink-3 text-sm font-bold">לא נמצא מחזור בתאריך זה</p>
          </div>
        )}

        {selectedRound && (
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Round info */}
            <div className="relative rounded-2xl p-4 overflow-hidden bg-gradient-to-l from-emerald-800/70 to-emerald-950/70 ring-1 ring-emerald-500/30">
              <div className="absolute -top-8 -left-8 w-24 h-24 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />
              <h2 className="relative text-white text-lg font-black">
                {format(new Date(selectedRound.date), 'dd MMMM yyyy', { locale: he })}
              </h2>
              <div className="relative flex items-center gap-2 mt-1 text-sm font-bold text-emerald-200/90 flex-wrap">
                <span className="tnum">{roundPlayers.length} שחקנים</span>
                <span className="text-emerald-400/50">·</span>
                <span className="tnum">נגבה ₪{totalCollected} מתוך ₪{totalExpected}</span>
              </div>
            </div>

            {/* Price setting */}
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/8 p-4 flex items-center justify-between">
              <span className="font-black text-white">מחיר לשחקן</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPricePerPlayer(p => Math.max(0, p - 5))}
                  aria-label="הפחת מחיר"
                  className="grid place-items-center w-11 h-11 rounded-xl bg-slate-800 ring-1 ring-white/10 text-white active:scale-95 transition-transform"
                >
                  <Minus className="w-5 h-5" />
                </button>
                <span className="tnum text-xl font-black text-amber-300 min-w-[3.5rem] text-center">₪{pricePerPlayer}</span>
                <button
                  onClick={() => setPricePerPlayer(p => p + 5)}
                  aria-label="הגדל מחיר"
                  className="grid place-items-center w-11 h-11 rounded-xl bg-slate-800 ring-1 ring-white/10 text-white active:scale-95 transition-transform"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-emerald-500/12 ring-1 ring-emerald-500/25 p-3 text-center">
                <p className="text-[0.66rem] text-emerald-300 font-bold mb-1">שילמו</p>
                <p className="tnum text-2xl font-black text-emerald-300">{paidCount}</p>
              </div>
              <div className="rounded-2xl bg-rose-500/12 ring-1 ring-rose-500/25 p-3 text-center">
                <p className="text-[0.66rem] text-rose-300 font-bold mb-1">לא שילמו</p>
                <p className="tnum text-2xl font-black text-rose-300">{roundPlayers.length - paidCount}</p>
              </div>
              <div className="rounded-2xl bg-amber-500/12 ring-1 ring-amber-500/25 p-3 text-center">
                <p className="text-[0.66rem] text-amber-300 font-bold mb-1">נגבה</p>
                <p className="tnum text-xl font-black text-amber-300">₪{totalCollected}</p>
              </div>
            </div>

            {/* Remind everyone unpaid — personal push per player, two-tap confirm */}
            {(() => {
              const unpaid = roundPlayers.filter((p) => !localPayments[p.id]);
              if (!unpaid.length) return null;
              if (bulkState === 'confirm') {
                return (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => sendReminderToAll(unpaid)}
                      className="flex-1 flex items-center justify-center gap-2 min-h-[50px] rounded-2xl bg-amber-500/20 ring-1 ring-amber-400/40 text-amber-200 font-black text-sm active:scale-[0.98] transition-transform touch-manipulation"
                    >
                      <BellRing className="w-5 h-5" />
                      כן, שלח ל-{unpaid.length} שחקנים
                    </button>
                    <button
                      type="button"
                      onClick={() => setBulkState('idle')}
                      className="px-5 min-h-[50px] rounded-2xl bg-slate-800 ring-1 ring-white/10 text-slate-300 font-black text-sm active:scale-[0.98] transition-transform touch-manipulation"
                    >
                      ביטול
                    </button>
                  </div>
                );
              }
              return (
                <button
                  type="button"
                  onClick={() => setBulkState('confirm')}
                  disabled={bulkState === 'sending'}
                  className="w-full flex items-center justify-center gap-2 min-h-[50px] rounded-2xl bg-amber-500/12 ring-1 ring-amber-500/30 text-amber-300 font-black text-sm active:scale-[0.98] disabled:opacity-60 transition-transform touch-manipulation"
                >
                  <BellRing className={`w-5 h-5 ${bulkState === 'sending' ? 'animate-pulse' : ''}`} />
                  {bulkState === 'sending' ? 'שולח תזכורות...' : `שלח תזכורת תשלום לכל מי שלא שילם (${unpaid.length})`}
                </button>
              );
            })()}

            {/* Player list */}
            <div className="rounded-2xl bg-slate-900/60 ring-1 ring-white/8 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <span className="font-black text-white">רשימת שחקנים</span>
                <span className="tnum text-xs font-black text-amber-300 bg-amber-500/12 ring-1 ring-amber-500/25 px-2.5 py-1 rounded-full">
                  {paidCount}/{roundPlayers.length}
                </span>
              </div>
              {roundPlayers.map((player, idx) => {
                const paid = !!localPayments[player.id];
                const reminded = remindedIds.has(player.id);
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                    className={`flex items-center border-b border-white/5 last:border-b-0 ${paid ? 'bg-emerald-500/10' : ''}`}
                  >
                  <button
                    type="button"
                    onClick={() => togglePayment(player.id)}
                    className={`flex-1 min-w-0 flex items-center gap-3 ps-4 pe-2 py-3.5 transition-colors active:opacity-70 ${
                      paid ? '' : 'active:bg-white/5'
                    }`}
                  >
                    {paid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-600 shrink-0" />
                    )}
                    {player.image ? (
                      <img src={player.image} alt={player.name} loading="lazy" className="w-10 h-10 rounded-full object-cover ring-1 ring-white/10 shrink-0" />
                    ) : (
                      <div className="grid place-items-center w-10 h-10 rounded-full bg-slate-700 ring-1 ring-white/10 shrink-0">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <span className={`flex-1 text-right font-bold text-sm ${paid ? 'text-emerald-300 line-through opacity-70' : 'text-white'}`}>
                      {player.name}
                    </span>
                    <span className={`tnum text-sm font-black shrink-0 ${paid ? 'text-emerald-300' : 'text-ink-3'}`}>
                      ₪{pricePerPlayer}
                    </span>
                  </button>
                  {/* Payment reminder push — only for players who haven't paid */}
                  <div className="w-14 shrink-0 grid place-items-center pe-3">
                    {!paid && (
                      <button
                        type="button"
                        onClick={() => sendReminder(player)}
                        disabled={remindingId === player.id}
                        aria-label={`שלח תזכורת תשלום ל${player.name}`}
                        className={`grid place-items-center w-11 h-11 rounded-xl ring-1 active:scale-95 disabled:opacity-50 transition-transform touch-manipulation ${
                          reminded
                            ? 'bg-emerald-500/15 ring-emerald-500/30 text-emerald-300'
                            : 'bg-amber-500/12 ring-amber-500/30 text-amber-300'
                        }`}
                      >
                        {reminded
                          ? <Check className="w-5 h-5" strokeWidth={2.6} />
                          : <BellRing className={`w-5 h-5 ${remindingId === player.id ? 'animate-pulse' : ''}`} />}
                      </button>
                    )}
                  </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Save */}
            <button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full flex items-center justify-center gap-2 min-h-[54px] rounded-2xl st-foil font-black text-base shadow-[0_10px_26px_-10px_rgba(212,160,40,0.6)] active:scale-[0.98] disabled:opacity-60 transition-transform"
            >
              <Save className="w-5 h-5" />
              {saveMutation.isPending ? 'שומר...' : 'שמור תשלומים'}
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
