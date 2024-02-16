import { QueryClient } from '@pkg/solid-query';

export const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			gcTime: 1 * 1_000, // 1 seconds
			staleTime: 30_000,
			refetchOnReconnect: false,
			refetchOnWindowFocus: false,
			retry: false,
			suspense: false,
		},
	},
});
