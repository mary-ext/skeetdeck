import type { MutationFilters } from '@tanstack/query-core';

import { type Accessor, createMemo, createSignal, onCleanup } from 'solid-js';

import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';

export function useIsMutating(
	filters?: Accessor<MutationFilters>,
	queryClient?: Accessor<QueryClient>,
): Accessor<number> {
	const client = createMemo(() => useQueryClient(queryClient?.()));
	const mutationCache = createMemo(() => client().getMutationCache());

	const [mutations, setMutations] = createSignal(client().isMutating(filters?.()));

	const unsubscribe = mutationCache().subscribe((_result) => {
		setMutations(client().isMutating(filters?.()));
	});

	onCleanup(unsubscribe);

	return mutations;
}
