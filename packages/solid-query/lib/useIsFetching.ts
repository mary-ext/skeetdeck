import { type QueryClient, type QueryFilters, notifyManager } from '@tanstack/query-core';
import { type Accessor, createSignal, onCleanup, untrack } from 'solid-js';

import { useQueryClient } from './QueryClientProvider.tsx';

export function useIsFetching(filters?: Accessor<QueryFilters>, queryClient?: QueryClient): Accessor<number> {
	return untrack(() => {
		const client = useQueryClient(queryClient);
		const queryCache = client.getQueryCache();

		const [mutations, setMutations] = createSignal(client.isFetching(filters?.()));

		onCleanup(
			queryCache.subscribe((_result) => {
				notifyManager.schedule(() => {
					setMutations(client.isFetching(filters?.()));
				});
			}),
		);

		return mutations;
	});
}
