import type { QueryFilters } from '@tanstack/query-core';

import { type Accessor, createMemo, createSignal, onCleanup } from 'solid-js';

import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';

export function useIsFetching(
	filters?: Accessor<QueryFilters>,
	queryClient?: Accessor<QueryClient>,
): Accessor<number> {
	const client = createMemo(() => useQueryClient(queryClient?.()));
	const queryCache = createMemo(() => client().getQueryCache());

	const [fetches, setFetches] = createSignal(client().isFetching(filters?.()));

	const unsubscribe = queryCache().subscribe(() => {
		setFetches(client().isFetching(filters?.()));
	});

	onCleanup(unsubscribe);

	return fetches;
}
