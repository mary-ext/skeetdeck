import { QueryClient } from '@tanstack/solid-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 1 * 1_000, // 1 seconds
			staleTime: Infinity, // the queries will be GC'd ASAP anyway.
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
			retry: false,
			suspense: false,
		},
	},
});
