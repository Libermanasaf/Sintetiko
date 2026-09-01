import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';
import { Player } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { PageHeader, Skeleton, EmptyState } from '@/components/ui/lux';
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
// One squad slot: the club's gold card, small, as it would sit on a team sheet.
// Deliberately compact — six of these share one pitch, so the card reads as a
// counter on a formation rather than a full-size hero card.
function SquadCard({ entry, player, rank }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.07 * rank, type: 'spring', damping: 20, stiffness: 240 }}
      className="flex flex-col items-center gap-1 w-full"
    >
      <div
        className="relative w-full"
        style={{
          aspectRatio: '2 / 3',
          backgroundImage: 'url(/gold-card.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.45))',
        }}
      >
        {rank === 1 && (
          <div
            className="absolute leading-none"
            style={{ top: '2%', insetInlineStart: '4%', fontSize: 'clamp(0.5rem,2.2vw,0.75rem)' }}
          >
            👑
          </div>
        )}

        <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '17%' }}>
          {player?.image ? (
            <img
              src={player.image}
              alt={entry.name}
              loading="lazy"
              decoding="async"
              className="rounded-full object-cover"
              style={{
                width: 'clamp(26px, 38%, 52px)', aspectRatio: '1',
                border: '2px solid rgba(200,155,30,0.9)',
              }}
            />
          ) : (
            <div
              className="rounded-full flex items-center justify-center font-black"
              style={{
                width: 'clamp(26px, 38%, 52px)', aspectRatio: '1',
                background: 'linear-gradient(135deg, rgba(212,175,55,0.4), rgba(180,130,20,0.25))',
                border: '2px solid rgba(200,155,30,0.9)',
                color: '#5a3500', fontSize: 'clamp(0.6rem, 2.6vw, 1rem)',
              }}
            >
              {entry.name?.charAt(0)}
            </div>
          )}
        </div>

        <div className="absolute left-0 right-0 text-center px-1" style={{ top: '62%' }}>
          <p
            className="font-black leading-tight truncate"
            style={{ color: '#3d2000', fontSize: 'clamp(0.4rem, 1.75vw, 0.62rem)' }}
          >
            {entry.name}
          </p>
        </div>

        {/* wins · appearances, on the card face where a FIFA card shows its stats */}
        <div className="absolute left-0 right-0 text-center" style={{ top: '73%' }}>
          <span
            className="font-black tnum"
            style={{ color: '#5a3500', fontSize: 'clamp(0.36rem, 1.6vw, 0.56rem)' }}
          >
            {entry.wins} נצ׳ · {entry.appearances} הופ׳
          </span>
        </div>
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

  // Scoped deliberately: only the month's rows, only the three columns the
  // ranking needs. Round.list() would pull EVERY round with all its jsonb
  // (teams, goals, MVP votes) on each visit — fine at 60 rounds, but it grows
  // with the club forever. See EGRESS.md.
  const { data: rounds = [], isLoading: loadingRounds } = useQuery({
    queryKey: ['rounds-team-of-month', start.toISOString()],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('rounds')
        .select('teams, winningTeam, date')
        .gte('date', start.toISOString())
        .lt('date', end.toISOString());
      if (error) { console.warn('[team-of-month]', error.message); return []; }
      return data || [];
    },
    staleTime: 10 * 60_000,
  });

  const squad = useMemo(() => {
    const nameById = new Map(players.map((p) => [p.id, p.name]));
    return pickTeamOfMonth(statsFromRounds(rounds || []), nameById);
  }, [rounds, players]);

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
          <div className="rounded-2xl bg-emerald-900/30 ring-1 ring-emerald-400/20 p-3 sm:p-5">
            <div className="grid grid-cols-3 gap-x-2 gap-y-3 sm:gap-x-4 sm:gap-y-5">
              {Array.from({ length: SQUAD_SIZE }).map((_, i) => (
                <Skeleton key={i} className="aspect-[2/3] rounded-lg" />
              ))}
            </div>
          </div>
        ) : squad.length === 0 ? (
          <EmptyState
            icon={Trophy}
            title={`אין עדיין נבחרת ל${monthName}`}
            hint={`נבחרת החודש נקבעת מהמחזורים של ${monthName}. שחקן נכנס אליה מ-${MIN_APPEARANCES} הופעות ומעלה.`}
          />
        ) : (
          <>
            {/* Pitch: mown stripes + centre circle and halfway line drawn in
                CSS, so there is no image to download. The six cards sit on it
                as a 3x2 formation. */}
            <div
              className="relative rounded-2xl overflow-hidden ring-1 ring-emerald-400/25 p-3 sm:p-5"
              style={{
                backgroundColor: 'hsl(148 42% 22%)',
                backgroundImage: [
                  'repeating-linear-gradient(90deg, hsl(148 44% 25%) 0 12.5%, hsl(148 40% 20%) 12.5% 25%)',
                  'radial-gradient(120% 90% at 50% 0%, hsl(148 50% 30% / .55), transparent 70%)',
                ].join(','),
                boxShadow: 'inset 0 0 60px rgba(0,0,0,.45)',
              }}
            >
              {/* markings */}
              <div aria-hidden className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-2 sm:inset-3 rounded-lg border border-white/25" />
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 border-t border-white/25" />
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/25"
                  style={{ width: 'clamp(60px, 26%, 130px)', aspectRatio: '1' }}
                />
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/35" />
              </div>

              <div className="relative grid grid-cols-3 gap-x-2 gap-y-3 sm:gap-x-4 sm:gap-y-5">
                {squad.map((entry, i) => (
                  <SquadCard
                    key={entry.id}
                    entry={entry}
                    player={playerById.get(entry.id)}
                    rank={i + 1}
                  />
                ))}
              </div>
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
