import { type DefaultError, MutationObserver } from '@tanstack/query-core';

import { createMemo, createRenderEffect, on, onCleanup, untrack } from 'solid-js';
import { createStore } from 'solid-js/store';

import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';
import type { CreateMutateFunction, CreateMutationOptions, CreateMutationResult } from './types.ts';

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

	const [state, setState] = createStore<CreateMutationResult<TData, TError, TVariables, TContext>>({
		...observer.getCurrentResult(),
		mutate,
		mutateAsync: observer.getCurrentResult().mutate,
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
		observer.subscribe((result) => {
			setState({
				...result,
				mutate,
				mutateAsync: result.mutate,
			});
		}),
	);

	return state;
}

function noop() {}
