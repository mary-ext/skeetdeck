import { batch, createSignal } from 'solid-js';

import { noop } from './utils.ts';

export type MutationFn<Data, Variables, Context> = (variables: Variables, context: Context) => Promise<Data>;

export interface MutationOptions<D, V, C> {
	mutate: MutationFn<D, V, C>;
	retry?: number;
	onMutate?: (variables: V) => C | Promise<C>;
	onSuccess?: (data: D, variables: V, context: C) => void | Promise<void>;
	onError?: (error: unknown, variables: V, context: C) => void | Promise<void>;
	onSettled?: (data: D | undefined, error: unknown, variables: V, context: C) => void | Promise<void>;
}

const enum MutationState {
	IDLE = 'idle',
	LOADING = 'loading',
	SUCCESS = 'success',
	ERROR = 'error',
}

interface MutationIdleResult {
	state: MutationState.IDLE;
	data: undefined;
	error: undefined;
	isIdle: true;
	isLoading: false;
	isSuccess: false;
	isError: false;
}

interface MutationLoadingResult {
	state: MutationState.LOADING;
	data: undefined;
	error: undefined;
	isIdle: false;
	isLoading: true;
	isSuccess: false;
	isError: false;
}

interface MutationSuccessResult<D> {
	state: MutationState.SUCCESS;
	data: D;
	error: undefined;
	isIdle: false;
	isLoading: false;
	isSuccess: true;
	isError: false;
}

interface MutationErrorResult {
	state: MutationState.ERROR;
	data: undefined;
	error: unknown;
	isIdle: false;
	isLoading: false;
	isSuccess: false;
	isError: true;
}

export type MutationResult<D> =
	| MutationIdleResult
	| MutationLoadingResult
	| MutationSuccessResult<D>
	| MutationErrorResult;

export interface MutationActions<D, V> {
	mutateAsync: (variables: V) => Promise<D>;
	mutate: (variables: V) => void;
}

export type MutationReturn<D, V> = MutationResult<D> & MutationActions<D, V>;

export const createMutation = <D, V, C = void>(options: MutationOptions<D, V, C>) => {
	let uid = 0;

	const [state, setState] = createSignal(MutationState.IDLE);
	const [value, setValue] = createSignal<unknown>();

	const mutateAsync = async (variables: V) => {
		const id = ++uid;
		const retries = options.retry ?? 0;

		let context = undefined as C;

		setState(MutationState.LOADING);

		try {
			context = (await options.onMutate?.(variables)) as C;

			let attempt = 0;
			let errored = false;
			let value: unknown;

			do {
				attempt++;

				try {
					errored = false;
					value = await options.mutate(variables, context);
					break;
				} catch (err) {
					errored = true;
					value = err;
				}
			} while (attempt < retries + 1);

			if (errored) {
				throw value;
			}

			await options.onSuccess?.(value as any, variables, context);
			await options.onSettled?.(value as any, undefined, variables, context);

			if (uid === id) {
				batch(() => {
					setState(MutationState.SUCCESS);
					setValue(value);
				});
			}

			return value as D;
		} catch (err) {
			try {
				await options.onError?.(err, variables, context);
				await options.onSettled?.(undefined, err, variables, context);

				throw err;
			} catch (err) {
				if (uid === id) {
					batch(() => {
						setState(MutationState.ERROR);
						setValue(err);
					});
				}

				throw err;
			}
		}
	};

	const mutate = (variables: V) => {
		mutateAsync(variables).catch(noop);
	};

	const instance = {
		mutateAsync,
		mutate,

		get state() {
			return state();
		},
		get data(): D | undefined {
			return state() === MutationState.SUCCESS ? (value() as any) : undefined;
		},
		get error(): unknown {
			return state() === MutationState.ERROR ? value() : undefined;
		},

		get isIdle() {
			return state() === MutationState.IDLE;
		},
		get isLoading() {
			return state() === MutationState.LOADING;
		},
		get isSuccess() {
			return state() === MutationState.SUCCESS;
		},
		get isError() {
			return state() === MutationState.ERROR;
		},
	};

	return instance as MutationReturn<D, V>;
};
