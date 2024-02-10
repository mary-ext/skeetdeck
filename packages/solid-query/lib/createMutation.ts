import { type DefaultError, MutationObserver, notifyManager } from '@tanstack/query-core';

import { createMemo, createRenderEffect, on, onCleanup, untrack } from 'solid-js';

import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';

import type { CreateMutateFunction, CreateMutationOptions, CreateMutationResult } from './types.ts';
import { createStateObject } from './utils.ts';

// HOOK
export function createMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: CreateMutationOptions<TData, TError, TVariables, TContext>,
	queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
	const client = useQueryClient(queryClient);

	const defaultedOptions = createMemo(() => {
		return options(client);
	});

	const initialDefaultedOptions = untrack(defaultedOptions);

	const observer = new MutationObserver<TData, TError, TVariables, TContext>(client, initialDefaultedOptions);

	const mutate: CreateMutateFunction<TData, TError, TVariables, TContext> = (variables, mutateOptions) => {
		observer.mutate(variables, mutateOptions).catch(noop);
	};

	const initialResult = observer.getCurrentResult();
	const result = createStateObject({
		...initialResult,
		mutate: mutate,
		mutateAsync: initialResult.mutate,
	});

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
}

function noop() {}
