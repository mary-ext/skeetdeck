import { MutationObserver, notifyManager, type DefaultError, type QueryClient } from '@tanstack/query-core';

import { createEffect, createMemo, on, onCleanup, untrack } from 'solid-js';

import { useQueryClient } from './QueryClientProvider.tsx';

import type { CreateMutateFunction, CreateMutationOptions, CreateMutationResult } from './types.ts';
import { createStateObject } from './utils.ts';

export function createMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: CreateMutationOptions<TData, TError, TVariables, TContext>,
	queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
	return untrack(() => {
		const client = useQueryClient(queryClient);

		const defaultedOptions = createMemo(() => {
			return client.defaultMutationOptions(options(client));
		});

		const initialDefaultedOptions = defaultedOptions();

		const observer = new MutationObserver<TData, TError, TVariables, TContext>(
			client,
			initialDefaultedOptions,
		);

		const mutate: CreateMutateFunction<TData, TError, TVariables, TContext> = (variables, mutateOptions) => {
			observer.mutate(variables, mutateOptions).catch(noop);
		};

		const initialResult = observer.getCurrentResult();
		const result = createStateObject({
			...initialResult,
			mutate: mutate,
			mutateAsync: initialResult.mutate,
		});

		createEffect(
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
				notifyManager.schedule(() => {
					Object.assign(result, {
						...next,
						mutate: mutate,
						mutateAsync: result.mutate,
					});
				});
			}),
		);

		return result;
	});
}

function noop() {}
