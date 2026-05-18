import React, { useState, useMemo, useEffect } from 'react';
import { Round, Player, Payment } from '@/api/entities';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { CreditCard, User, CheckCircle2, Circle, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { he } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function Payments() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [localPayments, setLocalPayments] = useState({});
  const [pricePerPlayer, setPricePerPlayer] = useState(40);
  const queryClient = useQueryClient();

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
        setPricePerPlayer(selectedPaymentRecord.pricePerPlayer || 40);
      } else {
        const initial = {};
        (selectedRound.teams || []).flat().forEach(id => { initial[id] = false; });
        setLocalPayments(initial);
        setPricePerPlayer(40);
      }
    }
  }, [selectedRound?.id, selectedPaymentRecord?.id]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!selectedRound) return;
      if (selectedPaymentRecord) {
        return Payment.update(selectedPaymentRecord.id, { payments: localPayments, pricePerPlayer });
      } else {
        return Payment.create({ roundId: selectedRound.id, roundDate: selectedRound.date, payments: localPayments, pricePerPlayer });
      }
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
  const greenDates = eligibleRounds.filter(r => {
    const rec = paymentRecords.find(p => p.roundId === r.id);
    return rec && Object.values(rec.payments || {}).filter(Boolean).length >= 18;
  }).map(r => new Date(r.date));
  const redDates = eligibleRounds.filter(r => {
    const rec = paymentRecords.find(p => p.roundId === r.id);
    if (!rec) return true;
    return Object.values(rec.payments || {}).filter(Boolean).length < 18;
  }).map(r => new Date(r.date));

  const roundPlayers = useMemo(() => {
    if (!selectedRound) return [];
    return (selectedRound.teams || []).flat().map(id => players.find(p => p.id === id)).filter(Boolean);
  }, [selectedRound, players]);

  const paidCount = roundPlayers.filter(p => localPayments[p.id]).length;
  const totalCollected = paidCount * pricePerPlayer;
  const totalExpected = roundPlayers.length * pricePerPlayer;

  return (
    <div className="pb-28">
      {/* Sticky Header */}
      <div className="sticky top-16 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/20 rounded-xl border border-emerald-500/30">
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <h1 className="text-xl font-black text-white">תשלומים</h1>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Calendar */}
        <div className="bg-slate-800/60 rounded-2xl p-3 border border-slate-700/60 overflow-hidden">
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
          <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-slate-700/40">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">בחר תאריך מחזור מלוח השנה</p>
          </div>
        )}

        {selectedDate && !selectedRound && (
          <div className="text-center py-10 bg-slate-800/40 rounded-2xl border border-slate-700/40">
            <CreditCard className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 text-sm">לא נמצא מחזור בתאריך זה</p>
          </div>
        )}

        {selectedRound && (
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Round info */}
            <div className="bg-gradient-to-r from-emerald-700 to-emerald-900 rounded-2xl p-4 text-white shadow-lg border border-emerald-600/40">
              <h2 className="text-lg font-black mb-1">
                {format(new Date(selectedRound.date), 'dd MMMM yyyy', { locale: he })}
              </h2>
              <div className="flex items-center gap-2 text-sm text-emerald-200 flex-wrap">
                <span>{roundPlayers.length} שחקנים</span>
                <span>·</span>
                <span>{paidCount} שילמו</span>
                <span>·</span>
                <span>נגבה: ₪{totalCollected} / ₪{totalExpected}</span>
              </div>
            </div>

            {/* Price setting */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 p-4 flex items-center justify-between">
              <span className="font-bold text-white">מחיר לשחקן</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPricePerPlayer(p => Math.max(0, p - 5))}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 active:bg-slate-500 flex items-center justify-center text-white transition-colors touch-manipulation"
                >
                  <ChevronDown className="w-5 h-5" />
                </button>
                <span className="text-xl font-black text-emerald-400 min-w-[3.5rem] text-center">₪{pricePerPlayer}</span>
                <button
                  onClick={() => setPricePerPlayer(p => p + 5)}
                  className="w-10 h-10 rounded-xl bg-slate-700 hover:bg-slate-600 active:bg-slate-500 flex items-center justify-center text-white transition-colors touch-manipulation"
                >
                  <ChevronUp className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-emerald-500/15 border border-emerald-500/20 rounded-2xl p-3 text-center">
                <p className="text-xs text-emerald-400 font-semibold mb-1">שילמו</p>
                <p className="text-2xl font-black text-emerald-400">{paidCount}</p>
              </div>
              <div className="bg-red-500/15 border border-red-500/20 rounded-2xl p-3 text-center">
                <p className="text-xs text-red-400 font-semibold mb-1">לא שילמו</p>
                <p className="text-2xl font-black text-red-400">{roundPlayers.length - paidCount}</p>
              </div>
              <div className="bg-amber-500/15 border border-amber-500/20 rounded-2xl p-3 text-center">
                <p className="text-xs text-amber-400 font-semibold mb-1">נגבה</p>
                <p className="text-xl font-black text-amber-400">₪{totalCollected}</p>
              </div>
            </div>

            {/* Player list */}
            <div className="bg-slate-800/60 rounded-2xl border border-slate-700/60 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700 flex items-center justify-between">
                <span className="font-bold text-white">רשימת שחקנים</span>
                <span className="text-xs text-slate-400 bg-slate-700 px-2.5 py-1 rounded-full">{paidCount}/{roundPlayers.length}</span>
              </div>
              {roundPlayers.map((player, idx) => {
                const paid = !!localPayments[player.id];
                return (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.02 }}
                    className={`flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/50 last:border-b-0 cursor-pointer transition-colors touch-manipulation active:opacity-70 ${paid ? 'bg-emerald-500/10' : 'hover:bg-slate-700/30'}`}
                    onClick={() => togglePayment(player.id)}
                  >
                    {paid ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-600 flex-shrink-0" />
                    )}
                    {player.image ? (
                      <img src={player.image} alt={player.name} className="w-10 h-10 rounded-full object-cover border border-slate-600 flex-shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center border border-slate-600 flex-shrink-0">
                        <User className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <span className={`flex-1 font-semibold text-sm ${paid ? 'text-emerald-400 line-through opacity-70' : 'text-white'}`}>
                      {player.name}
                    </span>
                    <span className={`text-sm font-bold flex-shrink-0 ${paid ? 'text-emerald-400' : 'text-slate-400'}`}>
                      ₪{pricePerPlayer}
                    </span>
                  </motion.div>
                );
              })}
            </div>

            {/* Save */}
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full h-14 text-base bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-2xl border border-emerald-500/40 shadow-lg shadow-emerald-900/30 touch-manipulation"
            >
              <Save className="w-5 h-5 ml-2" />
              {saveMutation.isPending ? 'שומר...' : 'שמור תשלומים'}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}