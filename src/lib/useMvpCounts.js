import { useQuery } from '@tanstack/react-query';
import { supabase } from './supabase';

// Loads { playerId: timesWasMvp } once and shares it across screens. Backed by
// the mvp_counts RPC (computed in the DB → tiny payload, egress-flat). Cached a
// few minutes since it only changes when a round's MVP vote tally shifts.
export function useMvpCounts() {
  const { data } = useQuery({
    queryKey: ['mvp-counts'],
    queryFn: async () => {
      if (!supabase) return {};
      const { data, error } = await supabase.rpc('mvp_counts');
      if (error) return {};
      const map = {};
      for (const row of data || []) map[row.player_id] = row.mvp_count;
      return map;
    },
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });
  return data || {};
}
