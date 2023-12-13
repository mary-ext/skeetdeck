import { type QueryKey, type QueryObserver, type QueryObserverResult } from '@tanstack/query-core';

import { createMemo, createRenderEffect, mergeProps, on, onCleanup, untrack } from 'solid-js';
import { createStore } from 'solid-js/store';
import { isServer } from 'solid-js/web';

import { useIsRestoring } from './isRestoring.ts';
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
	const isRestoring = useIsRestoring();

	const defaultedOptions = createMemo(() => {
		return mergeProps(client.defaultQueryOptions(options(client)) || {}, {
			get _optimisticResults() {
				return isRestoring() ? 'isRestoring' : 'optimistic';
			},
			...(isServer && { retry: false, throwOnError: true }),
		});
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

	createRenderEffect(() => {
		const $isRestoring = isRestoring();

		if (!$isRestoring) {
			onCleanup(
				observer.subscribe((result) => {
					// @todo: do we even need to wrap these with notifyManager.batchCalls?
					setState(result);
				}),
			);
		}

		observer.updateResult();
	});

	return state;
}
