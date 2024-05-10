import {
	type QueryClient,
	type QueryKey,
	type QueryObserver,
	type QueryObserverResult,
	notifyManager,
} from '@tanstack/query-core';

import { createMemo, createRenderEffect, on, onCleanup, untrack } from 'solid-js';

import { useQueryClient } from './QueryClientProvider.tsx';

import type { CreateBaseQueryOptions, QueryAccessor } from './types.ts';
import { createStateObject } from './utils.ts';

// Base Query Function that is used to create the query.
export function createBaseQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(
	options: QueryAccessor<CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>>,
	Observer: typeof QueryObserver,
	queryClient?: QueryClient,
): QueryObserverResult<TData, TError> {
	return untrack(() => {
		const client = useQueryClient(queryClient);

		const defaultedOptions = createMemo(() => {
			return client.defaultQueryOptions(options(client));
		});

		const initialDefaultedOptions = defaultedOptions();

		const observer = new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
			client,
			initialDefaultedOptions,
		);

		const result = createStateObject(untrack(() => observer.getOptimisticResult(initialDefaultedOptions)));

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
			observer.subscribe((next) => {
				notifyManager.schedule(() => Object.assign(result, next));
			}),
		);

		observer.updateResult();

		return result;
	});
}
