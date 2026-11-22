// Shared "fix a round's players" save — used by GameHistory (closed rounds)
// and MatchDay (the live round). Saves the corrected roster AND moves the
// stored counters with it (appearances / wins / season_wins — see
// rosterEdit.js). Counters are read fresh for just the affected players, so a
// stale cached list can't overwrite someone else's update.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Round, Player } from '@/api/entities';
import { supabase } from '@/lib/supabase';
import { rosterStatDeltas, remapRoundRefs } from '@/lib/rosterEdit';

export function useRosterEdit({ enabled, onSaved }) {
  const queryClient = useQueryClient();

  // Current podium season — a roster fix on a round from an earlier season
  // must not move season_wins (the live podium).
  const { data: seasonStart } = useQuery({
    queryKey: ['current-season-start'],
    queryFn: async () => {
      const { data } = await supabase
        .from('podium_seasons').select('started_at').eq('is_current', true).maybeSingle();
      return data?.started_at || null;
    },
    enabled: enabled && !!supabase,
    staleTime: 60 * 60_000,
  });

  const isInCurrentSeason = (round) =>
    !!seasonStart && !!round && new Date(round.date) >= new Date(seasonStart);

  const mutation = useMutation({
    mutationFn: async ({ round, teams, replacements }) => {
      const deltas = rosterStatDeltas(round, teams, isInCurrentSeason(round));
      await Round.update(round.id, { teams, ...remapRoundRefs(round, replacements) });

      const ids = Object.keys(deltas);
      if (ids.length) {
        const { data: fresh, error } = await supabase
          .from('players').select('id, appearances, wins, season_wins').in('id', ids);
        if (error) throw error;
        await Promise.all(fresh.map((p) => {
          const d = deltas[p.id];
          return Player.update(p.id, {
            appearances: Math.max(0, (p.appearances || 0) + d.appearances),
            wins: Math.max(0, (p.wins || 0) + d.wins),
            season_wins: Math.max(0, (p.season_wins || 0) + d.season_wins),
          });
        }));
      }
      return ids.length;
    },
    onSuccess: (changedCount) => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] });
      queryClient.invalidateQueries({ queryKey: ['latest-round'] });
      queryClient.invalidateQueries({ queryKey: ['latest-round-admin'] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      toast.success(changedCount
        ? `שחקני המחזור עודכנו, והסטטיסטיקה תוקנה ל-${changedCount} שחקנים ✅`
        : 'סידור הקבוצות עודכן ✅');
      onSaved?.();
    },
    onError: (e) => {
      console.error('[roster edit]', e);
      toast.error('השמירה נכשלה', { description: e?.message || 'נסה שוב' });
    },
  });

  return { isInCurrentSeason, save: mutation.mutate, saving: mutation.isPending };
}
