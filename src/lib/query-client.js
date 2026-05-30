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