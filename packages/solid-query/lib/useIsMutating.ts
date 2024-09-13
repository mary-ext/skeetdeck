import { type MutationFilters, type QueryClient, notifyManager } from '@tanstack/query-core';
import { type Accessor, createSignal, onCleanup, untrack } from 'solid-js';

import { useQueryClient } from './QueryClientProvider.tsx';

export function useIsMutating(
	filters?: Accessor<MutationFilters>,
	queryClient?: QueryClient,
): Accessor<number> {
	return untrack(() => {
		const client = useQueryClient(queryClient);
		const mutationCache = client.getMutationCache();

		const [mutations, setMutations] = createSignal(client.isMutating(filters?.()));

		onCleanup(
			mutationCache.subscribe((_result) => {
				notifyManager.schedule(() => {
					setMutations(client.isMutating(filters?.()));
				});
			}),
		);

		return mutations;
	});
}
