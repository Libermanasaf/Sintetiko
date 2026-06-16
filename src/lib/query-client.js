import { QueryClient } from '@tanstack/react-query';


export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			// Treat fetched data as fresh for 30s so navigating between screens
			// (which all share keys like ['players']) doesn't refetch on every
			// mount. Screens that need tighter liveness override this locally.
			staleTime: 30_000,
		},
	},
});

// The ['players'] list (~18 KB) is the single biggest payload pulled on almost
// every app open — and it barely changes (a name/rating edit now and then). At
// 30s stale, a user who opens the app many times a day refetches it constantly:
// 100 users × 100 opens/day × 18 KB ≈ 5+ GB/month, enough to blow the cap on
// frequency alone (concurrency is irrelevant — egress is the monthly byte sum).
//
// So we cache it for 10 minutes. This is SAFE because every mutation that changes
// a player (update/create/delete, goals, wins) already calls
// invalidateQueries(['players']), which overrides staleTime and refetches
// immediately. Result: data is always fresh right after a change, but repeated
// opens with no change cost zero. gcTime keeps it in memory across screen
// navigation so re-mounts reuse it.
queryClientInstance.setQueryDefaults(['players'], {
	staleTime: 10 * 60_000,
	gcTime: 15 * 60_000,
});