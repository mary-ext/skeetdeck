import type { QueryFilters } from '@tanstack/query-core';

import { type Accessor, createSignal, onCleanup, untrack } from 'solid-js';

import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';

export function useIsFetching(filters?: Accessor<QueryFilters>, queryClient?: QueryClient): Accessor<number> {
	const client = useQueryClient(queryClient);
	const queryCache = client.getQueryCache();

	const initialFilters = untrack(() => filters?.());
	const [fetches, setFetches] = createSignal(client.isFetching(initialFilters));

	const unsubscribe = queryCache.subscribe(() => {
		setFetches(client.isFetching(filters?.()));
	});

	onCleanup(unsubscribe);

	return fetches;
}
