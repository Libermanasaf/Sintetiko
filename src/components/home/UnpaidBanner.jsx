// "You have an open payment" banner on the player's home — the reminder that
// needs no push permission and no admin action. Driven by the
// my_unpaid_payments RPC (the caller's own unpaid rounds, last 30 days); it
// disappears by itself once the admin marks the payment in Payments.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Wallet } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const dayLabel = (iso) =>
  new Date(iso).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'numeric' });

export default function UnpaidBanner({ userId }) {
  const { data: unpaid = [] } = useQuery({
    queryKey: ['my-unpaid-payments', userId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('my_unpaid_payments');
      if (error) { console.warn('[unpaid]', error.message); return []; }
      return data || [];
    },
    enabled: !!supabase && !!userId,
    staleTime: 5 * 60_000,
  });

  if (!unpaid.length) return null;
  const total = unpaid.reduce((s, r) => s + Number(r.price || 0), 0);
  const dates = unpaid.map((r) => dayLabel(r.round_date)).join(', ');

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-xs"
      role="status"
    >
      <div className="flex items-start gap-3 px-4 py-3 rounded-2xl bg-rose-500/12 ring-1 ring-rose-400/35">
        <div className="grid place-items-center w-9 h-9 rounded-xl bg-rose-500/20 shrink-0">
          <Wallet className="w-4 h-4 text-rose-300" strokeWidth={2.4} />
        </div>
        <div className="flex-1 min-w-0 text-right">
          <p className="text-rose-100 font-black text-sm leading-tight">
            יש לך תשלום פתוח: <span className="tnum">₪{total}</span>
          </p>
          <p className="text-rose-200/75 text-[0.7rem] font-bold leading-relaxed mt-0.5">
            {unpaid.length === 1 ? `על המשחק מ-${dates}` : `על המשחקים מ-${dates}`} · נשמח שתעביר בהקדם 🙏
          </p>
        </div>
      </div>
    </motion.div>
  );
}
