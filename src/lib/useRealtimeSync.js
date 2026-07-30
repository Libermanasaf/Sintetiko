import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from './supabase';

// Cross-device live sync (phone <-> desktop, both directions).
//
// Subscribes to Postgres change events for `table` and invalidates the given
// react-query keys when a row changes, so any other device showing that data
// refreshes within ~a second instead of waiting for staleTime/window-focus.
//
// Requires the table to be in the `supabase_realtime` publication — see
// migration 20260730120000_enable_realtime_sync.sql. Without that, this
// subscribes successfully and silently receives nothing.
//
// EGRESS: this REPLACES polling, it doesn't stack on top of it. One shared
// WebSocket pushes a changed row once, instead of every client re-fetching a
// whole table on a timer. Invalidation is what triggers the (narrow) re-fetch,
// and only when something actually changed. See EGRESS.md.
//
// `onChange` is optional and runs before invalidation, for state that lives
// outside react-query (e.g. Lists.jsx keeps rosters in useState).
export function useRealtimeSync(table, queryKeys, onChange) {
  const queryClient = useQueryClient();

  // Keep the latest callback/keys in refs so re-renders don't tear down and
  // rebuild the WebSocket subscription on every parent render.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const keysRef = useRef(queryKeys);
  keysRef.current = queryKeys;

  useEffect(() => {
    if (!supabase || !table) return;

    // Unique channel name per mount: Supabase dedupes by name, so a fixed name
    // would collide under StrictMode's double-mount (and across two components
    // watching the same table), silently dropping one subscription's events.
    const channelName = `sync:${table}:${Math.random().toString(36).slice(2)}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (payload) => {
          try {
            onChangeRef.current?.(payload);
          } catch (e) {
            console.warn(`[realtime:${table}] onChange handler threw`, e);
          }
          for (const key of keysRef.current || []) {
            queryClient.invalidateQueries({
              queryKey: Array.isArray(key) ? key : [key],
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Non-fatal: the existing staleTime / refetchOnWindowFocus paths still
          // provide eventual consistency, so a dropped socket degrades to the
          // old behaviour rather than breaking the screen.
          console.warn(`[realtime:${table}] subscription ${status}`);
        }
      });

    return () => { supabase.removeChannel(channel); };
    // `table` is the only real dependency; keys/onChange are held in refs above.
  }, [table, queryClient]);
}
