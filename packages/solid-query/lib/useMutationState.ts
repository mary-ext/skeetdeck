import {
	type DefaultError,
	type Mutation,
	type MutationCache,
	type MutationFilters,
	type MutationState,
	replaceEqualDeep,
} from '@tanstack/query-core';

import { type Accessor, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';

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
	queryClient?: Accessor<QueryClient>,
): Accessor<Array<TResult>> {
	const client = createMemo(() => useQueryClient(queryClient?.()));
	const mutationCache = createMemo(() => client().getMutationCache());

	const [result, setResult] = createSignal(getResult(mutationCache(), options()));

	createEffect(() => {
		const unsubscribe = mutationCache().subscribe(() => {
			const nextResult = replaceEqualDeep(result(), getResult(mutationCache(), options()));
			if (result() !== nextResult) {
				setResult(nextResult);
			}
		});

		onCleanup(unsubscribe);
	});

	return result;
}
