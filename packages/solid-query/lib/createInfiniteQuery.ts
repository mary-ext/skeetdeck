import {
	type DefaultError,
	type InfiniteData,
	type QueryKey,
	type QueryObserver,
	InfiniteQueryObserver,
} from '@tanstack/query-core';

import { createBaseQuery } from './createBaseQuery.ts';
import type { QueryClient } from './QueryClient.ts';
import type { CreateInfiniteQueryOptions, CreateInfiniteQueryResult } from './types.ts';

export function createInfiniteQuery<
	TQueryFnData,
	TError = DefaultError,
	TData = InfiniteData<TQueryFnData>,
	TQueryKey extends QueryKey = QueryKey,
	TPageParam = unknown,
>(
	options: CreateInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey, TPageParam>,
	queryClient?: QueryClient,
): CreateInfiniteQueryResult<TData, TError> {
	return createBaseQuery(
		options,
		InfiniteQueryObserver as typeof QueryObserver,
		queryClient,
	) as CreateInfiniteQueryResult<TData, TError>;
}
