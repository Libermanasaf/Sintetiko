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

// The ['latest-round'] probe ("is a match live right now?") is pulled on nearly
// every open by Home/PlayerHome/BottomNav and polled while the tab is visible.
// In a month with no matches the answer never changes, yet at 100 opens/day it
// would re-fetch the 5 recent rounds 300k+ times (~4 GB) for nothing — the
// biggest idle-month egress driver. We cache it 3 minutes.
//
// SAFE for liveness: (1) publishing a round already calls
// invalidateQueries(['latest-round']) → instant refetch; (2) a published round
// also fires a push notification, so the probe is only a fallback, not the
// primary signal; (3) MatchDay (the live screen) sets its OWN staleTime: 30s /
// refetchInterval: 60s locally, and the shorter staleTime wins for an active
// observer — so the live screen stays live. This default only relaxes the
// idle probe on the home screens.
queryClientInstance.setQueryDefaults(['latest-round'], {
	staleTime: 3 * 60_000,
	gcTime: 5 * 60_000,
});