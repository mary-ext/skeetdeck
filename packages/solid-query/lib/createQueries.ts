import {
	type DefaultError,
	type QueriesObserverOptions,
	type QueriesPlaceholderDataFunction,
	type QueryClient,
	type QueryFunction,
	type QueryKey,
	type ThrowOnError,
	QueriesObserver,
} from '@tanstack/query-core';

import {
	type Accessor,
	createMemo,
	createRenderEffect,
	createSignal,
	on,
	onCleanup,
	untrack,
} from 'solid-js';

import { useQueryClient } from './QueryClientProvider.tsx';

import type { CreateQueryResult, QueryAccessor, SolidQueryOptions } from './types.ts';

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
										select?: (data: any) => infer TData;
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
										queryFn?: QueryFunction<infer TQueryFnData, any>;
										select?: (data: any) => infer TData;
										throwOnError?: ThrowOnError<any, infer TError, any, any>;
								  }
								? CreateQueryResult<
										unknown extends TData ? TQueryFnData : TData,
										unknown extends TError ? DefaultError : TError
									>
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
type QueriesOptions<
	T extends Array<any>,
	TResult extends Array<any> = [],
	TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
	? Array<CreateQueryOptionsForCreateQueries>
	: T extends []
		? []
		: T extends [infer Head]
			? [...TResult, GetOptions<Head>]
			: T extends [infer Head, ...infer Tail]
				? QueriesOptions<[...Tail], [...TResult, GetOptions<Head>], [...TDepth, 1]>
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
type QueriesResults<
	T extends Array<any>,
	TResult extends Array<any> = [],
	TDepth extends ReadonlyArray<number> = [],
> = TDepth['length'] extends MAXIMUM_DEPTH
	? Array<CreateQueryResult>
	: T extends []
		? []
		: T extends [infer Head]
			? [...TResult, GetResults<Head>]
			: T extends [infer Head, ...infer Tail]
				? QueriesResults<[...Tail], [...TResult, GetResults<Head>], [...TDepth, 1]>
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

export function createQueries<T extends any[], TCombinedResult = QueriesResults<T>>(
	queriesOptions: QueryAccessor<{
		queries: readonly [...QueriesOptions<T>];
		combine?: (result: QueriesResults<T>) => TCombinedResult;
	}>,
	queryClient?: QueryClient,
): Accessor<TCombinedResult> {
	return untrack(() => {
		const client = useQueryClient(queryClient);

		const defaultedOptions = createMemo(() => {
			const $queriesOptions = queriesOptions(client);

			return {
				queries: $queriesOptions.queries.map((queryOptions) => {
					return client.defaultQueryOptions(queryOptions);
				}),
				combine: $queriesOptions.combine,
			};
		});

		const initialDefaultedOptions = defaultedOptions();

		const observer = new QueriesObserver(
			client,
			initialDefaultedOptions.queries,
			initialDefaultedOptions as QueriesObserverOptions<TCombinedResult>,
		);

		const [, getInitialResult] = observer.getOptimisticResult(
			initialDefaultedOptions.queries,
			(initialDefaultedOptions as QueriesObserverOptions<TCombinedResult>).combine,
		);

		const [state, setState] = createSignal(getInitialResult());

		createRenderEffect(
			on(defaultedOptions, ($defaultedOptions) => {
				observer.setQueries(
					$defaultedOptions.queries,
					$defaultedOptions as QueriesObserverOptions<TCombinedResult>,
				);
			}),
		);

		onCleanup(
			observer.subscribe(() => {
				const $defaultedOptions = defaultedOptions();
				const [, getResult] = observer.getOptimisticResult(
					$defaultedOptions.queries,
					($defaultedOptions as QueriesObserverOptions<TCombinedResult>).combine,
				);

				setState(() => getResult());
			}),
		);

		return state;
	});
}
