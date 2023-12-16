import { type QueryKey, type QueryObserver, type QueryObserverResult } from '@tanstack/query-core';

import { createMemo, createRenderEffect, createSignal, getOwner, on, onCleanup, untrack } from 'solid-js';

import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';

import type { CreateBaseQueryOptions, QueryAccessor } from './types.ts';
import { memoHandlers } from './utils.ts';

// Base Query Function that is used to create the query.
export function createBaseQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(
	options: QueryAccessor<CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>>,
	Observer: typeof QueryObserver,
	queryClient?: QueryClient,
) {
	const owner = getOwner();
	const client = useQueryClient(queryClient);

	const defaultedOptions = createMemo(() => {
		return client.defaultQueryOptions(options(client));
	});

	const initialDefaultedOptions = untrack(defaultedOptions);

	const observer = new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
		client,
		initialDefaultedOptions,
	);

	const [state, setState] = createSignal<QueryObserverResult<TData, TError>>(
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

	const proxy = new Proxy({ s: state, o: owner, h: {} }, memoHandlers);
	return proxy as unknown as QueryObserverResult<TData, TError>;
}
