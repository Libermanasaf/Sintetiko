import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { callApi } from '../lib/apiClient';
import { motion } from 'framer-motion';
import { Coins, User, Check, Loader2, BellRing, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

const DAY_FMT = (d) => new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

// The admin's personal payment page (Bit/PayBox link). When set, the debt
// reminder becomes one-tap-to-pay: tapping the push opens this link directly
// (sw.js opens external URLs in a new window). Empty = plain reminder.
const PAYMENT_LINK = '';

export default function Debts() {
  const queryClient = useQueryClient();
  const [remindingId, setRemindingId] = useState(null); // `${round_id}_${player_id}` being reminded
  const [editing, setEditing] = useState(null);   // `${round_id}_${player_id}` whose amount is being edited
  const [editValue, setEditValue] = useState('');

  // Save a manual per-debt amount.
  const setAmount = useMutation({
    mutationFn: ({ round_id, player_id, amount }) =>
      supabase.rpc('set_debt_amount', { p_round_id: round_id, p_player_id: player_id, p_amount: amount })
        .then(({ error }) => { if (error) throw error; }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      setEditing(null);
    },
    onError: (e) => toast.error('עדכון הסכום נכשל', { description: e.message }),
  });

  const startEdit = (d) => {
    setEditing(`${d.round_id}_${d.player_id}`);
    setEditValue(String(d.amount ?? 40));
  };
  const saveEdit = (d) => {
    const n = parseInt(editValue, 10);
    if (Number.isNaN(n) || n < 0) { toast.error('סכום לא תקין'); return; }
    setAmount.mutate({ round_id: d.round_id, player_id: d.player_id, amount: n });
  };

  // Send a personal payment-reminder push to one debtor (targeted by email).
  const sendReminder = async (debt) => {
    if (!debt.email || !debt.subscribed) {
      toast.error('לא ניתן לשלוח', { description: `ל${debt.player_name} אין התראות פעילות` });
      return;
    }
    const id = `${debt.round_id}_${debt.player_id}`;
    setRemindingId(id);
    try {
      const res = await callApi('/api/send-notification', {
        targetEmail: debt.email,
        title: 'תזכורת תשלום — סינתטיקו חולון 💰',
        body: PAYMENT_LINK
          ? `היי ${debt.player_name}, טרם שילמת עבור המשחק בתאריך ${DAY_FMT(debt.round_date)} — לחץ לתשלום מהיר 💳`
          : `היי ${debt.player_name}, טרם שילמת עבור המשחק בתאריך ${DAY_FMT(debt.round_date)}`,
        url: PAYMENT_LINK || '/',
      });
      const pd = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(pd.error || `שגיאת שרת ${res.status}`);
      if ((pd.sent || 0) === 0) toast.warning(`התזכורת ל${debt.player_name} לא נמסרה (אין מנוי פעיל)`);
      else toast.success(`תזכורת נשלחה ל${debt.player_name}`);
    } catch (e) {
      toast.error('שליחת התזכורת נכשלה', { description: e.message });
    } finally {
      setRemindingId(null);
    }
  };

  const { data: debts = [], isLoading } = useQuery({
    queryKey: ['debts'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('unpaid_debts');
      if (error) throw error;
      return data || [];
    },
  });

  const markPaid = useMutation({
    mutationFn: ({ round_id, player_id }) =>
      supabase.rpc('mark_round_paid', { p_round_id: round_id, p_player_id: player_id })
        .then(({ error }) => { if (error) throw error; }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['debts'] });
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast.success('סומן כשולם');
    },
    onError: (e) => toast.error('הסימון נכשל', { description: e.message }),
  });

  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const total = debts.reduce((s, d) => s + (d.amount || 0), 0);

  return (
    <div className="pb-10">
      <PageHeader
        icon={Coins}
        title="חובות"
        subtitle={debts.length ? `${debts.length} חובות · ₪${total}` : 'שחקנים שלא שילמו (מ-21.6)'}
        accent="amber"
      />

      <div className="p-4 space-y-3">
        {isLoading ? (
          <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 rounded-2xl" />)}</div>
        ) : debts.length === 0 ? (
          <EmptyState
            icon={Coins}
            title="אין חובות 🎉"
            hint="כל מי ששיחק מ-21.6 ואילך — שילם."
          />
        ) : (
          debts.map((d, i) => (
            <motion.div
              key={`${d.round_id}_${d.player_id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              className="flex items-center gap-3 rounded-2xl bg-slate-900/70 ring-1 ring-rose-500/20 p-3.5"
            >
              <div className="grid place-items-center w-10 h-10 rounded-xl bg-rose-500/15 ring-1 ring-rose-500/30 shrink-0">
                <User className="w-4 h-4 text-rose-300" strokeWidth={2.4} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-white text-sm truncate">{d.player_name}</p>
                <p className="text-ink-3 text-xs font-bold mt-0.5 flex items-center gap-1 flex-wrap">
                  <span>מחזור</span>
                  <span className="tnum">{fmtDate(d.round_date)}</span>
                  <span>· חוב</span>
                  {editing === `${d.round_id}_${d.player_id}` ? (
                    <span className="inline-flex items-center gap-1">
                      <span className="text-rose-300">₪</span>
                      <input
                        type="number" inputMode="numeric" autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(d); if (e.key === 'Escape') setEditing(null); }}
                        className="w-14 bg-slate-800 ring-1 ring-amber-400/40 rounded-md px-1.5 py-0.5 text-amber-200 tnum text-xs font-black outline-none"
                      />
                      <button onClick={() => saveEdit(d)} disabled={setAmount.isPending}
                        className="grid place-items-center w-6 h-6 rounded-md bg-emerald-500/20 text-emerald-300 active:scale-90" aria-label="שמור סכום">
                        {setAmount.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </button>
                    </span>
                  ) : (
                    <button onClick={() => startEdit(d)}
                      title="לחץ לעריכת הסכום"
                      className="inline-flex items-center gap-1 tnum text-rose-300 hover:text-amber-300 transition-colors">
                      ₪{d.amount}
                      <Pencil className="w-3 h-3 opacity-60" />
                    </button>
                  )}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {/* Reminder push — disabled if the debtor has no active push */}
                <button
                  onClick={() => sendReminder(d)}
                  disabled={remindingId !== null || !d.subscribed}
                  title={d.subscribed ? 'שלח תזכורת תשלום' : `ל${d.player_name} אין התראות פעילות`}
                  aria-label="שלח תזכורת"
                  className="grid place-items-center w-10 h-10 rounded-xl bg-amber-500/15 ring-1 ring-amber-500/35 text-amber-300 active:scale-95 transition-transform touch-manipulation disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {remindingId === `${d.round_id}_${d.player_id}`
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <BellRing className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => markPaid.mutate({ round_id: d.round_id, player_id: d.player_id })}
                  disabled={markPaid.isPending}
                  className="flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/35 text-emerald-300 font-black text-sm active:scale-95 transition-transform touch-manipulation disabled:opacity-50"
                >
                  {markPaid.isPending && markPaid.variables?.player_id === d.player_id
                    ? <Loader2 className="w-4 h-4 animate-spin" />
                    : <Check className="w-4 h-4" strokeWidth={3} />}
                  שולם
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
