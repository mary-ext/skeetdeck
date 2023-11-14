import {
	type DefaultError,
	type QueriesObserverOptions,
	type QueriesPlaceholderDataFunction,
	type QueryFunction,
	type QueryKey,
	type QueryObserverResult,
	type ThrowOnError,
	QueriesObserver,
} from '@tanstack/query-core';

import {
	type Accessor,
	batch,
	createComputed,
	createMemo,
	createRenderEffect,
	mergeProps,
	on,
	onCleanup,
	onMount,
} from 'solid-js';
import { createStore } from 'solid-js/store';

import { useIsRestoring } from './isRestoring.ts';
import type { QueryClient } from './QueryClient.ts';
import { useQueryClient } from './QueryClientProvider.tsx';
import type { CreateQueryResult, SolidQueryOptions } from './types.ts';

// This defines the `UseQueryOptions` that are accepted in `QueriesOptions` & `GetOptions`.
// `placeholderData` function does not have a parameter
type CreateQueryOptionsForCreateQueries<
	TQueryFnData = unknown,
	TError = DefaultError,
	TData = TQueryFnData,
	TQueryKey extends QueryKey = QueryKey,
> = Omit<SolidQueryOptions<TQueryFnData, TError, TData, TQueryKey>, 'placeholderData'> & {
	placeholderData?: TQueryFnData | QueriesPlaceholderDataFunction<TQueryFnData>;
};

// Avoid TS depth-limit error in case of large array literal
type MAXIMUM_DEPTH = 20;

type GetOptions<T> =
	// Part 1: responsible for applying explicit type parameter to function arguments, if object { queryFnData: TQueryFnData, error: TError, data: TData }
	T extends {
		queryFnData: infer TQueryFnData;
		error?: infer TError;
		data: infer TData;
	}
		? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData>
		: T extends { queryFnData: infer TQueryFnData; error?: infer TError }
		  ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError>
		  : T extends { data: infer TData; error?: infer TError }
		    ? CreateQueryOptionsForCreateQueries<unknown, TError, TData>
		    : // Part 2: responsible for applying explicit type parameter to function arguments, if tuple [TQueryFnData, TError, TData]
		      T extends [infer TQueryFnData, infer TError, infer TData]
		      ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData>
		      : T extends [infer TQueryFnData, infer TError]
		        ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError>
		        : T extends [infer TQueryFnData]
		          ? CreateQueryOptionsForCreateQueries<TQueryFnData>
		          : // Part 3: responsible for inferring and enforcing type if no explicit parameter was provided
		            T extends {
										queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>;
										select: (data: any) => infer TData;
										throwOnError?: ThrowOnError<any, infer TError, any, any>;
		              }
		            ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>
		            : T extends {
											queryFn?: QueryFunction<infer TQueryFnData, infer TQueryKey>;
											throwOnError?: ThrowOnError<any, infer TError, any, any>;
		                }
		              ? CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TQueryFnData, TQueryKey>
		              : // Fallback
		                CreateQueryOptionsForCreateQueries;

type GetResults<T> =
	// Part 1: responsible for mapping explicit type parameter to function result, if object
	T extends { queryFnData: any; error?: infer TError; data: infer TData }
		? CreateQueryResult<TData, TError>
		: T extends { queryFnData: infer TQueryFnData; error?: infer TError }
		  ? CreateQueryResult<TQueryFnData, TError>
		  : T extends { data: infer TData; error?: infer TError }
		    ? CreateQueryResult<TData, TError>
		    : // Part 2: responsible for mapping explicit type parameter to function result, if tuple
		      T extends [any, infer TError, infer TData]
		      ? CreateQueryResult<TData, TError>
		      : T extends [infer TQueryFnData, infer TError]
		        ? CreateQueryResult<TQueryFnData, TError>
		        : T extends [infer TQueryFnData]
		          ? CreateQueryResult<TQueryFnData>
		          : // Part 3: responsible for mapping inferred type to results, if no explicit parameter was provided
		            T extends {
										queryFn?: QueryFunction<unknown, any>;
										select: (data: any) => infer TData;
										throwOnError?: ThrowOnError<any, infer TError, any, any>;
		              }
		            ? CreateQueryResult<TData, unknown extends TError ? DefaultError : TError>
		            : T extends {
											queryFn?: QueryFunction<infer TQueryFnData, any>;
											throwOnError?: ThrowOnError<any, infer TError, any, any>;
		                }
		              ? CreateQueryResult<TQueryFnData, unknown extends TError ? DefaultError : TError>
		              : // Fallback
		                CreateQueryResult;

/**
 * QueriesOptions reducer recursively unwraps function arguments to infer/enforce type param
 */
export type QueriesOptions<
	T extends Array<any>,
	Result extends Array<any> = [],
	Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
	? Array<CreateQueryOptionsForCreateQueries>
	: T extends []
	  ? []
	  : T extends [infer Head]
	    ? [...Result, GetOptions<Head>]
	    : T extends [infer Head, ...infer Tail]
	      ? QueriesOptions<[...Tail], [...Result, GetOptions<Head>], [...Depth, 1]>
	      : Array<unknown> extends T
	        ? T
	        : // If T is *some* array but we couldn't assign unknown[] to it, then it must hold some known/homogenous type!
	          // use this to infer the param types in the case of Array.map() argument
	          T extends Array<
								CreateQueryOptionsForCreateQueries<
									infer TQueryFnData,
									infer TError,
									infer TData,
									infer TQueryKey
								>
	            >
	          ? Array<CreateQueryOptionsForCreateQueries<TQueryFnData, TError, TData, TQueryKey>>
	          : // Fallback
	            Array<CreateQueryOptionsForCreateQueries>;

/**
 * QueriesResults reducer recursively maps type param to results
 */
export type QueriesResults<
	T extends Array<any>,
	Result extends Array<any> = [],
	Depth extends ReadonlyArray<number> = [],
> = Depth['length'] extends MAXIMUM_DEPTH
	? Array<CreateQueryResult>
	: T extends []
	  ? []
	  : T extends [infer Head]
	    ? [...Result, GetResults<Head>]
	    : T extends [infer Head, ...infer Tail]
	      ? QueriesResults<[...Tail], [...Result, GetResults<Head>], [...Depth, 1]>
	      : T extends Array<
							CreateQueryOptionsForCreateQueries<infer TQueryFnData, infer TError, infer TData, any>
	          >
	        ? // Dynamic-size (homogenous) UseQueryOptions array: map directly to array of results
	          Array<
							CreateQueryResult<
								unknown extends TData ? TQueryFnData : TData,
								unknown extends TError ? DefaultError : TError
							>
	          >
	        : // Fallback
	          Array<CreateQueryResult>;

export function createQueries<
	T extends Array<any>,
	TCombinedResult extends QueriesResults<T> = QueriesResults<T>,
>(
	queriesOptions: Accessor<{
		queries: readonly [...QueriesOptions<T>];
		combine?: (result: QueriesResults<T>) => TCombinedResult;
	}>,
	queryClient?: QueryClient,
): TCombinedResult {
	const client = useQueryClient(queryClient);
	const isRestoring = useIsRestoring();

	const defaultedQueries = createMemo(() => {
		return queriesOptions().queries.map((options) =>
			mergeProps(client.defaultQueryOptions(options), {
				get _optimisticResults() {
					return isRestoring() ? 'isRestoring' : 'optimistic';
				},
			}),
		);
	});

	const observer = new QueriesObserver(
		client,
		defaultedQueries(),
		queriesOptions().combine
			? ({
					combine: queriesOptions().combine,
			  } as QueriesObserverOptions<TCombinedResult>)
			: undefined,
	);

	const [state, setState] = createStore<TCombinedResult>(
		observer.getOptimisticResult(defaultedQueries())[1](),
	);

	createRenderEffect(
		on(
			() => queriesOptions().queries.length,
			() => setState(observer.getOptimisticResult(defaultedQueries())[1]()),
		),
	);

	let taskQueue: Array<() => void> = [];
	const subscribeToObserver = () =>
		observer.subscribe((result) => {
			taskQueue.push(() => {
				batch(() => {
					for (let index = 0, length = state.length; index < length; index++) {
						// @ts-expect-error typescript pedantry regarding the possible range of index
						setState(index, result[index]);
					}
				});
			});

			queueMicrotask(() => {
				const taskToRun = taskQueue.pop();
				if (taskToRun) taskToRun();
				taskQueue = [];
			});
		});

	let unsubscribe: () => void = () => undefined;
	createComputed<() => void>((cleanup) => {
		cleanup?.();
		unsubscribe = isRestoring() ? () => undefined : subscribeToObserver();
		// cleanup needs to be scheduled after synchronous effects take place
		return () => queueMicrotask(unsubscribe);
	});
	onCleanup(unsubscribe);

	onMount(() => {
		observer.setQueries(
			defaultedQueries(),
			queriesOptions().combine
				? ({
						combine: queriesOptions().combine,
				  } as QueriesObserverOptions<TCombinedResult>)
				: undefined,
			{ listeners: false },
		);
	});

	createComputed(() => {
		observer.setQueries(
			defaultedQueries(),
			queriesOptions().combine
				? ({
						combine: queriesOptions().combine,
				  } as QueriesObserverOptions<TCombinedResult>)
				: undefined,
			{ listeners: false },
		);
	});

	const handler = {
		get(target: QueryObserverResult, prop: keyof QueryObserverResult): any {
			return Reflect.get(target, prop);
		},
	};

	const getProxies = () => {
		return state.map((s) => {
			return new Proxy(s, handler);
		});
	};

	const [proxifiedState, setProxifiedState] = createStore(getProxies());
	createRenderEffect(() => setProxifiedState(getProxies()));

	return proxifiedState as TCombinedResult;
}
