import {
	type DefaultError,
	type Mutation,
	type MutationCache,
	type MutationFilters,
	type MutationState,
	replaceEqualDeep,
} from '@tanstack/query-core';

import { type Accessor, createEffect, createSignal, onCleanup, untrack } from 'solid-js';

import type { QueryClient } from './QueryClient.ts';
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
	const client = useQueryClient(queryClient);
	const mutationCache = client.getMutationCache();

	const initialOptions = untrack(options);
	const [result, setResult] = createSignal(getResult(mutationCache, initialOptions));

	createEffect(() => {
		const unsubscribe = mutationCache.subscribe(() => {
			const nextResult = replaceEqualDeep(result(), getResult(mutationCache, options()));

			if (result() !== nextResult) {
				setResult(nextResult);
			}
		});

		onCleanup(unsubscribe);
	});

	return result;
}
