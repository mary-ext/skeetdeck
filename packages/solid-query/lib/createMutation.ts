import { type DefaultError, MutationObserver } from '@tanstack/query-core';

import { createMemo, createRenderEffect, createSignal, getOwner, on, onCleanup, untrack } from 'solid-js';

import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';

import type { CreateMutateFunction, CreateMutationOptions, CreateMutationResult } from './types.ts';
import { memoHandlers } from './utils.ts';

// HOOK
export function createMutation<TData = unknown, TError = DefaultError, TVariables = void, TContext = unknown>(
	options: CreateMutationOptions<TData, TError, TVariables, TContext>,
	queryClient?: QueryClient,
): CreateMutationResult<TData, TError, TVariables, TContext> {
	const owner = getOwner();
	const client = useQueryClient(queryClient);

	const defaultedOptions = createMemo(() => {
		return options(client);
	});

	const initialDefaultedOptions = untrack(defaultedOptions);

	const observer = new MutationObserver<TData, TError, TVariables, TContext>(client, initialDefaultedOptions);

	const mutate: CreateMutateFunction<TData, TError, TVariables, TContext> = (variables, mutateOptions) => {
		observer.mutate(variables, mutateOptions).catch(noop);
	};

	const [state, setState] = createSignal<CreateMutationResult<TData, TError, TVariables, TContext>>({
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

	const proxy = new Proxy({ s: state, o: owner, h: {} }, memoHandlers);
	return proxy as unknown as CreateMutationResult<TData, TError, TVariables, TContext>;
}

function noop() {}
