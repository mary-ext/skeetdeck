import { type QueryKey, type QueryObserver, type QueryObserverResult } from '@tanstack/query-core';

import { createMemo, createRenderEffect, on, onCleanup, untrack } from 'solid-js';
import { createStore } from 'solid-js/store';

import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';
import type { CreateBaseQueryOptions, QueryAccessor } from './types.ts';

// Base Query Function that is used to create the query.
export function createBaseQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(
	options: QueryAccessor<CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>>,
	Observer: typeof QueryObserver,
	queryClient?: QueryClient,
) {
	const client = useQueryClient(queryClient);

	const defaultedOptions = createMemo(() => {
		return client.defaultQueryOptions(options(client));
	});

	const initialDefaultedOptions = untrack(defaultedOptions);

	const observer = new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
		client,
		initialDefaultedOptions,
	);

	const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
		observer.getOptimisticResult(initialDefaultedOptions),
	);

	createRenderEffect(
		on(
			defaultedOptions,
			($defaultedOptions) => {
				observer.setOptions($defaultedOptions);
			},
			{ defer: true },
		),
	);

	onCleanup(
		observer.subscribe((result) => {
			setState(result);
		}),
	);

	observer.updateResult();
	return state;
}
