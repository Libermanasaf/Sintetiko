import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Coins, User, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader, EmptyState, Skeleton } from '@/components/ui/lux';

export default function Debts() {
  const queryClient = useQueryClient();

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
                <p className="text-ink-3 text-xs font-bold mt-0.5">
                  מחזור <span className="tnum">{fmtDate(d.round_date)}</span> · חוב <span className="tnum text-rose-300">₪{d.amount}</span>
                </p>
              </div>
              <button
                onClick={() => markPaid.mutate({ round_id: d.round_id, player_id: d.player_id })}
                disabled={markPaid.isPending}
                className="flex items-center gap-1.5 min-h-[40px] px-3.5 rounded-xl bg-emerald-500/15 ring-1 ring-emerald-500/35 text-emerald-300 font-black text-sm active:scale-95 transition-transform touch-manipulation disabled:opacity-50 shrink-0"
              >
                {markPaid.isPending && markPaid.variables?.player_id === d.player_id
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Check className="w-4 h-4" strokeWidth={3} />}
                שולם
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
