import {
	notifyManager,
	replaceEqualDeep,
	type DefaultError,
	type Mutation,
	type MutationCache,
	type MutationFilters,
	type MutationState,
	type QueryClient,
} from '@tanstack/query-core';

import { createSignal, onCleanup, untrack, type Accessor } from 'solid-js';

import { useQueryClient } from './QueryClientProvider.tsx';

type MutationStateOptions<TResult = MutationState> = {
	filters?: MutationFilters;
	select?: (mutation: Mutation<unknown, DefaultError, unknown, unknown>) => TResult;
};

function getResult<TResult = MutationState>(
	mutationCache: MutationCache,
	options: MutationStateOptions<TResult>,
): Array<TResult> {
	return mutationCache
		.findAll(options.filters)
		.map(
			(mutation): TResult =>
				(options.select
					? options.select(mutation as Mutation<unknown, DefaultError, unknown, unknown>)
					: mutation.state) as TResult,
		);
}

export function useMutationState<TResult = MutationState>(
	options: Accessor<MutationStateOptions<TResult>> = () => ({}),
	queryClient?: QueryClient,
): Accessor<Array<TResult>> {
	return untrack(() => {
		const client = useQueryClient(queryClient);
		const mutationCache = client.getMutationCache();

		const [result, setResult] = createSignal(getResult(mutationCache, options()));

		onCleanup(
			mutationCache.subscribe(() => {
				notifyManager.schedule(() => {
					setResult((result) => replaceEqualDeep(result, getResult(mutationCache, options())));
				});
			}),
		);

		return result;
	});
}
