import { type QueryKey, type QueryObserver, type QueryObserverResult } from '@tanstack/query-core';

import { type Accessor, createMemo, mergeProps, on, onCleanup, untrack, createRenderEffect } from 'solid-js';
import { createStore, reconcile } from 'solid-js/store';
import { isServer } from 'solid-js/web';

import { useIsRestoring } from './isRestoring.ts';
import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';
import type { CreateBaseQueryOptions } from './types.ts';

function reconcileFn<TData, TError>(
	store: QueryObserverResult<TData, TError>,
	result: QueryObserverResult<TData, TError>,
	reconcileOption: string | false | ((oldData: TData | undefined, newData: TData) => TData),
): QueryObserverResult<TData, TError> {
	if (reconcileOption === false) {
		return result;
	}

	if (typeof reconcileOption === 'function') {
		const newData = reconcileOption(store.data, result.data as TData);
		return { ...result, data: newData } as typeof result;
	}

	const newData = reconcile(result.data, { key: reconcileOption })(store.data);

	return { ...result, data: newData } as typeof result;
}

// Base Query Function that is used to create the query.
export function createBaseQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(
	options: Accessor<CreateBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>>,
	Observer: typeof QueryObserver,
	queryClient?: QueryClient,
) {
	const client = useQueryClient(queryClient);
	const isRestoring = useIsRestoring();

	const defaultedOptions = createMemo(() => {
		return mergeProps(client.defaultQueryOptions(options()) || {}, {
			get _optimisticResults() {
				return isRestoring() ? 'isRestoring' : 'optimistic';
			},
			structuralSharing: false,
			...(isServer && { retry: false, throwOnError: true }),
		});
	});

	const observer = new Observer<TQueryFnData, TError, TData, TQueryData, TQueryKey>(
		client,
		untrack(defaultedOptions),
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

	const [state, setState] = createStore<QueryObserverResult<TData, TError>>(
		observer.getOptimisticResult(defaultedOptions()),
	);

	createRenderEffect(() => {
		const $isRestoring = isRestoring();

		if (!$isRestoring) {
			onCleanup(
				observer.subscribe((result) => {
					// @todo: do we even need to wrap these with notifyManager.batchCalls?

					// @ts-expect-error - This will error because the reconcile option does not
					// exist on the query-core QueryObserverResult type
					const reconcileOptions = observer.options.reconcile;

					setState((store) => {
						return reconcileFn(store, result, reconcileOptions === undefined ? false : reconcileOptions);
					});
				}),
			);
		}

		observer.updateResult();
	});

	return state;
}
