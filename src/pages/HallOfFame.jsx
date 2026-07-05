import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Crown, Trophy, Zap, Target, Shirt, Medal, Flame, User } from 'lucide-react';
import { Player } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { useMvpCounts } from '@/lib/useMvpCounts';
import { PageHeader, LuxCard, Skeleton, EmptyState } from '@/components/ui/lux';

/* ═══════════════════════════════════════════════════════════════════
   היכל התהילה — the club's kings, one card per crown.
   All data is either already-loaded (players) or one tiny RPC
   (hall_of_fame_stats: goals + current streak) + mvp_counts. Egress-flat.
   ═══════════════════════════════════════════════════════════════════ */

const rate = (p) => ((p.appearances || 0) > 0 ? (p.wins || 0) / p.appearances : 0);

function Avatar({ player, size = 'w-12 h-12', ring = 'ring-amber-400/50' }) {
  return player?.image ? (
    <img src={player.image} alt={player.name} loading="lazy"
      className={`${size} rounded-xl object-cover ring-2 ${ring} shrink-0`} />
  ) : (
    <div className={`${size} rounded-xl bg-slate-700 grid place-items-center ring-2 ${ring} shrink-0`}>
      <User className="w-5 h-5 text-slate-400" />
    </div>
  );
}

// One crown category: champion up top (crowned), two runners-up beneath.
function KingCard({ title, icon: Icon, entries, delay = 0 }) {
  if (!entries.length || !entries[0].value) return null;
  const [king, ...rest] = entries;
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', damping: 22, stiffness: 220 }}
    >
      <LuxCard accent="amber" clip glow className="h-full">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-3.5">
            <div className="grid place-items-center w-8 h-8 rounded-lg bg-amber-500/15 ring-1 ring-amber-500/30 shrink-0">
              <Icon className="w-4 h-4 text-amber-300" strokeWidth={2.4} />
            </div>
            <h3 className="font-black text-amber-200 text-sm tracking-wide">{title}</h3>
          </div>

          {/* The king */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Avatar player={king.player} />
              <Crown className="absolute -top-2.5 -right-1.5 w-5 h-5 text-amber-400 fill-amber-400/30 rotate-12" strokeWidth={2.2} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-base leading-tight truncate">{king.player.name}</p>
              <p className="st-gold-text font-black text-xl leading-tight tnum">{king.label}</p>
            </div>
          </div>

          {/* Runners-up */}
          {rest.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-white/5 space-y-1.5">
              {rest.map((e, i) => (
                <div key={e.player.id} className="flex items-center gap-2">
                  <span className="text-ink-3 text-[0.65rem] font-black w-4 text-center tnum shrink-0">{i + 2}</span>
                  <Avatar player={e.player} size="w-6 h-6" ring="ring-white/10" />
                  <span className="text-slate-300 text-xs font-bold truncate flex-1">{e.player.name}</span>
                  <span className="text-ink-2 text-xs font-black tnum shrink-0">{e.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </LuxCard>
    </motion.div>
  );
}

export default function HallOfFame() {
  const mvpCounts = useMvpCounts();

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list(),
  });

  const { data: hofStats = [], isLoading: loadingHof } = useQuery({
    queryKey: ['hall-of-fame'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('hall_of_fame_stats');
      if (error) throw error;
      return data || [];
    },
    staleTime: 300_000,
  });

  const categories = useMemo(() => {
    if (!players.length) return [];
    const byId = new Map(players.map((p) => [p.id, p]));
    const goalsOf = new Map(hofStats.map((h) => [h.player_id, h.goals]));
    const streakOf = new Map(hofStats.map((h) => [h.player_id, h.streak]));

    // top-3 helper: sort by value desc with optional tiebreak, drop zeros
    const top3 = (list, valueOf, labelOf, tiebreak) =>
      [...list]
        .map((p) => ({ player: p, value: valueOf(p) }))
        .filter((e) => e.value > 0)
        .sort((a, b) => (b.value - a.value) || (tiebreak ? tiebreak(b.player) - tiebreak(a.player) : 0))
        .slice(0, 3)
        .map((e) => ({ ...e, label: labelOf(e) }));

    const experienced = players.filter((p) => (p.appearances || 0) >= 5);

    return [
      {
        title: 'מלך הגביעים', icon: Trophy,
        // the standing club rule: trophies first, efficiency breaks ties
        entries: top3(players, (p) => p.wins || 0, (e) => `${e.value} גביעים`, rate),
      },
      {
        title: 'מלך היעילות', icon: Zap,
        entries: top3(experienced, (p) => Math.round(rate(p) * 100), (e) => `${e.value}%`,
          (p) => p.wins || 0),
      },
      {
        title: 'מלך השערים', icon: Target,
        entries: top3(players, (p) => goalsOf.get(p.id) || 0,
          (e) => (e.value === 1 ? 'שער אחד' : `${e.value} שערים`)),
      },
      {
        title: 'מלך ההופעות', icon: Shirt,
        entries: top3(players, (p) => p.appearances || 0, (e) => `${e.value} משחקים`),
      },
      {
        title: 'מלך ה-MVP', icon: Medal,
        entries: top3(players, (p) => mvpCounts[p.id] || 0, (e) => `MVP ×${e.value}`),
      },
      {
        title: 'הרצף החם', icon: Flame,
        entries: top3(players, (p) => streakOf.get(p.id) || 0,
          (e) => `${e.value} ברצף`, (p) => p.appearances || 0),
      },
    ].filter((c) => c.entries.length > 0);
  }, [players, hofStats, mvpCounts]);

  const isLoading = loadingPlayers || loadingHof;

  return (
    <div className="pb-10" dir="rtl">
      <PageHeader
        icon={Crown}
        title="היכל התהילה"
        subtitle="המלכים של סינתטיקו חולון"
        accent="amber"
      />

      <div className="p-4">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
          </div>
        ) : categories.length === 0 ? (
          <EmptyState icon={Crown} title="ההיכל עוד ריק" hint="שחקו מחזורים — והמלכים יוכתרו כאן." />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {categories.map((c, i) => (
              <KingCard key={c.title} title={c.title} icon={c.icon} entries={c.entries} delay={i * 0.06} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
