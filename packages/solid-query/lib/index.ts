import './notifyManager.ts';

// Re-export core
export * from '@tanstack/query-core';

// Solid Query
export { createInfiniteQuery } from './createInfiniteQuery.ts';
export { createMutation } from './createMutation.ts';
export { createQuery, queryOptions } from './createQuery.ts';
export { QueryClient } from './QueryClient.ts';
export type {
	DefaultOptions,
	InfiniteQueryObserverOptions,
	QueryClientConfig,
	QueryObserverOptions,
} from './QueryClient.ts';
export { QueryClientContext, QueryClientProvider, useQueryClient } from './QueryClientProvider.tsx';
export type { QueryClientProviderProps } from './QueryClientProvider.tsx';
export * from './types.ts';
export { useIsFetching } from './useIsFetching.ts';
export { useIsMutating } from './useIsMutating.ts';
export { useMutationState } from './useMutationState.ts';
