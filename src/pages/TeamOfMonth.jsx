import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy, User, Crown } from 'lucide-react';
import { Player, Round } from '@/api/entities';
import { PageHeader, Skeleton, EmptyState } from '@/components/ui/lux';
import { POSITION_LABELS } from '@/lib/positions';
import {
  statsFromRounds, pickTeamOfMonth, MIN_APPEARANCES, SQUAD_SIZE,
} from '@/lib/teamOfMonth';

/* ═══════════════════════════════════════════════════════════════════
   נבחרת החודש — the six players the monthly push names, as cards.
   The push carries the same names (both sides call pickTeamOfMonth),
   so the notification and this screen can never disagree.
   ═══════════════════════════════════════════════════════════════════ */

// The month the squad covers: the PREVIOUS calendar month, matching the cron
// that sends the push on the 1st.
function previousMonthWindow() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 1);
  return { start, end };
}

function SquadCard({ entry, player, rank }) {
  const winRate = entry.appearances > 0
    ? Math.round((entry.wins / entry.appearances) * 100)
    : 0;
  const isTop = rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.05 * rank, type: 'spring', damping: 22, stiffness: 220 }}
      className="relative rounded-2xl p-px bg-gradient-to-b from-amber-300/70 via-amber-500/25 to-slate-800/10"
    >
      <div className="rounded-[15px] bg-gradient-to-b from-slate-800/95 to-slate-950 p-3 flex flex-col items-center gap-2 h-full">
        {/* rank + rating corner, like a card's top-left block */}
        <div className="w-full flex items-start justify-between">
          <span className="st-foil grid place-items-center w-6 h-6 rounded-lg font-black text-xs tnum">
            {rank}
          </span>
          {isTop && <Crown className="w-4 h-4 text-amber-300" strokeWidth={2.6} />}
        </div>

        {player?.image ? (
          <img
            src={player.image}
            alt={player.name}
            loading="lazy"
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-2 ring-amber-300/70"
          />
        ) : (
          <div className="grid place-items-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-700 ring-2 ring-amber-300/70">
            <User className="w-7 h-7 text-slate-400" />
          </div>
        )}

        <p className="font-black text-white text-[0.8rem] sm:text-sm leading-tight text-center truncate max-w-full">
          {entry.name}
        </p>

        {player?.position && (
          <span className="text-amber-300/80 text-[0.6rem] font-black leading-none -mt-1">
            {POSITION_LABELS[player.position]}
          </span>
        )}

        {/* the two numbers the ranking is actually based on */}
        <div className="w-full grid grid-cols-2 gap-1 mt-auto pt-1">
          <div className="rounded-lg bg-emerald-500/12 ring-1 ring-emerald-400/25 py-1 text-center">
            <p className="text-emerald-300 font-black text-sm tnum leading-none">{entry.wins}</p>
            <p className="text-emerald-400/70 text-[0.52rem] font-bold mt-0.5">נצחונות</p>
          </div>
          <div className="rounded-lg bg-slate-700/40 ring-1 ring-white/10 py-1 text-center">
            <p className="text-white font-black text-sm tnum leading-none">{entry.appearances}</p>
            <p className="text-slate-400 text-[0.52rem] font-bold mt-0.5">הופעות</p>
          </div>
        </div>

        <p className="text-ink-3 text-[0.55rem] font-bold tnum">{winRate}% ניצחון</p>
      </div>
    </motion.div>
  );
}

export default function TeamOfMonth() {
  const { start, end } = useMemo(previousMonthWindow, []);
  const monthName = useMemo(
    () => new Intl.DateTimeFormat('he-IL', { month: 'long' }).format(start),
    [start]
  );

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => Player.list('name'),
  });

  const { data: rounds = [], isLoading: loadingRounds } = useQuery({
    queryKey: ['rounds-team-of-month', start.toISOString()],
    queryFn: () => Round.list('-date'),
    staleTime: 5 * 60_000,
  });

  const squad = useMemo(() => {
    const inMonth = (rounds || []).filter((r) => {
      const d = new Date(r.date);
      return d >= start && d < end;
    });
    const nameById = new Map(players.map((p) => [p.id, p.name]));
    return pickTeamOfMonth(statsFromRounds(inMonth), nameById);
  }, [rounds, players, start, end]);

  const playerById = useMemo(
    () => new Map(players.map((p) => [p.id, p])),
    [players]
  );

  const isLoading = loadingPlayers || loadingRounds;

  return (
    <div className="pb-10">
      <PageHeader
        icon={Trophy}
        title={`נבחרת ${monthName}`}
        subtitle={`${SQUAD_SIZE} השחקנים המובילים`}
        accent="amber"
      />

      <div className="p-4 space-y-4">
        <div className="flex items-start gap-2.5 rounded-xl bg-amber-500/8 ring-1 ring-amber-500/20 px-3.5 py-2.5">
          <Trophy className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
          <p className="text-amber-200/80 text-xs font-bold leading-relaxed">
            הדירוג לפי מספר הניצחונות בחודש. בתיקו — מי שהופיע יותר.
            נדרשות לפחות {MIN_APPEARANCES} הופעות כדי להיכנס לנבחרת.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {Array.from({ length: SQUAD_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : squad.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={`אין עדיין נבחרת ל${monthName}`}
            hint={`נבחרת החודש נקבעת מהמחזורים של ${monthName}. שחקן נכנס אליה מ-${MIN_APPEARANCES} הופעות ומעלה.`}
          />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {squad.map((entry, i) => (
                <SquadCard
                  key={entry.id}
                  entry={entry}
                  player={playerById.get(entry.id)}
                  rank={i + 1}
                />
              ))}
            </div>
            {squad.length < SQUAD_SIZE && (
              <p className="text-center text-ink-3 text-xs font-bold">
                רק {squad.length} שחקנים עברו את הרף של {MIN_APPEARANCES} הופעות ב{monthName}.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
