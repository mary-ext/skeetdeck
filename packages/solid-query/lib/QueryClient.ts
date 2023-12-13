import {
	type DefaultError,
	type DefaultOptions as CoreDefaultOptions,
	type InfiniteQueryObserverOptions as QueryCoreInfiniteQueryObserverOptions,
	type QueryClientConfig as QueryCoreClientConfig,
	type QueryKey,
	type QueryObserverOptions as QueryCoreObserverOptions,
	QueryClient as QueryCoreClient,
} from '@tanstack/query-core';

export interface QueryObserverOptions<
	TQueryFnData = unknown,
	TError = DefaultError,
	TData = TQueryFnData,
	TQueryData = TQueryFnData,
	TQueryKey extends QueryKey = QueryKey,
	TPageParam = never,
> extends QueryCoreObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey, TPageParam> {}

export interface InfiniteQueryObserverOptions<
	TQueryFnData = unknown,
	TError = DefaultError,
	TData = TQueryFnData,
	TQueryData = TQueryFnData,
	TQueryKey extends QueryKey = QueryKey,
	TPageParam = unknown,
> extends QueryCoreInfiniteQueryObserverOptions<
		TQueryFnData,
		TError,
		TData,
		TQueryData,
		TQueryKey,
		TPageParam
	> {}

export interface DefaultOptions<TError = DefaultError> extends CoreDefaultOptions<TError> {
	queries?: QueryObserverOptions<unknown, TError>;
}

export interface QueryClientConfig extends QueryCoreClientConfig {
	defaultOptions?: DefaultOptions;
}

export class QueryClient extends QueryCoreClient {
	constructor(config: QueryClientConfig = {}) {
		super(config);
	}
}
