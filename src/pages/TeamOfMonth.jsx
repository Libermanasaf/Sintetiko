import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
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

// One squad slot rendered as the club's gold player card — the same
// /gold-card.png frame and layout as the card on PlayerHome, so a player
// recognises their own card here. Rank, wins and appearances sit outside the
// frame so nothing covers the artwork.
function SquadCard({ entry, player, rank }) {
  const winRate = entry.appearances > 0
    ? Math.round((entry.wins / entry.appearances) * 100)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.06 * rank, type: 'spring', damping: 22, stiffness: 220 }}
      className="flex flex-col items-center gap-2"
    >
      <div
        className="relative w-full"
        style={{
          aspectRatio: '2 / 3',
          backgroundImage: 'url(/gold-card.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          filter: 'drop-shadow(0 10px 24px rgba(200,150,25,0.35))',
        }}
      >
        {/* rank badge — top corner, clear of the crest */}
        <div
          className="absolute grid place-items-center rounded-lg font-black tnum"
          style={{
            top: '4%', insetInlineEnd: '6%',
            width: '22%', maxWidth: 30, aspectRatio: '1',
            background: 'rgba(61,32,0,0.85)', color: '#f5d67a',
            fontSize: 'clamp(0.6rem, 2.6vw, 0.85rem)',
          }}
        >
          {rank}
        </div>

        {rank === 1 && (
          <div className="absolute" style={{ top: '3%', insetInlineStart: '6%', fontSize: 'clamp(0.8rem,3.4vw,1.1rem)' }}>
            👑
          </div>
        )}

        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '18%' }}>
          {player?.image ? (
            <img
              src={player.image}
              alt={entry.name}
              loading="lazy"
              decoding="async"
              className="rounded-full object-cover"
              style={{
                width: 'clamp(44px, 34%, 96px)', aspectRatio: '1',
                border: '3px solid rgba(200,155,30,0.85)',
                boxShadow: '0 0 18px rgba(200,155,30,0.5)',
              }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center font-black"
              style={{
                width: 'clamp(44px, 34%, 96px)', aspectRatio: '1',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.35), rgba(180,130,20,0.2))',
                border: '3px solid rgba(200,155,30,0.85)',
                boxShadow: '0 0 18px rgba(200,155,30,0.5)',
                color: '#5a3500', fontSize: 'clamp(1rem, 5vw, 1.8rem)',
              }}
            >
              {entry.name?.charAt(0)}
            </div>
          )}
        </div>

        <div className="absolute left-0 right-0 text-center px-2" style={{ top: '64%' }}>
          <p
            className="font-black leading-tight truncate"
            style={{ color: '#3d2000', fontSize: 'clamp(0.6rem, 2.7vw, 0.95rem)' }}
          >
            {entry.name}
          </p>
        </div>

        {player?.position && (
          <div className="absolute left-0 right-0 text-center" style={{ top: '73%' }}>
            <span
              className="font-black"
              style={{ color: '#5a3500', fontSize: 'clamp(0.45rem, 2vw, 0.7rem)' }}
            >
              {POSITION_LABELS[player.position]}
            </span>
          </div>
        )}
      </div>

      {/* The two numbers the ranking is based on, kept off the artwork. */}
      <div className="w-full grid grid-cols-2 gap-1">
        <div className="rounded-lg bg-emerald-500/12 ring-1 ring-emerald-400/25 py-1 text-center">
          <p className="text-emerald-300 font-black text-sm tnum leading-none">{entry.wins}</p>
          <p className="text-emerald-400/70 text-[0.5rem] font-bold mt-0.5">נצחונות</p>
        </div>
        <div className="rounded-lg bg-slate-700/40 ring-1 ring-white/10 py-1 text-center">
          <p className="text-white font-black text-sm tnum leading-none">{entry.appearances}</p>
          <p className="text-slate-400 text-[0.5rem] font-bold mt-0.5">הופעות</p>
        </div>
      </div>
      <p className="text-ink-3 text-[0.55rem] font-bold tnum -mt-1">{winRate}% ניצחון</p>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Array.from({ length: SQUAD_SIZE }).map((_, i) => (
              <Skeleton key={i} className="aspect-[2/3] rounded-2xl" />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
