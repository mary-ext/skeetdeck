import { type Accessor, type Setter, createSignal, createContext, createMemo, useContext } from 'solid-js';

import { hashQueryKey, type QueryKey } from './key.ts';
import { replaceEqualDeep } from './utils.ts';

export type QueryStatus = 'loading' | 'error' | 'success';

export interface QueryState<Data, Param = unknown> {
	status: QueryStatus;
	data: Data | null;
	param: Param | undefined;
	error: unknown;
	fetching: boolean;
	invalidated: boolean;
	updatedAt: number;
	isPlaceholderData: boolean;
}

export interface QueryResult<Data, Param = unknown> {
	state: Accessor<QueryState<Data, Param>>;
	update: Setter<QueryState<Data, Param>>;

	timeout: unknown;
	promise: Promise<void> | null;
	count: number;
}

const createQueryResult = <Data, Param = unknown>(): QueryResult<Data, Param> => {
	const [state, update] = createSignal<QueryState<Data, Param>>({
		status: 'loading',
		data: null,
		param: undefined,
		error: null,
		fetching: false,
		invalidated: true,
		updatedAt: -1,
		isPlaceholderData: false,
	});

	return {
		state: state,
		update: update,

		timeout: null,
		promise: null,
		count: 0,
	};
};

export interface QueryInfo<Data, Param = unknown> {
	data: Data | undefined;
	param: Param | undefined;
}

export type QueryFn<Data, Key extends QueryKey = QueryKey, Param = unknown> = (
	key: Key,
	info: QueryInfo<Data, Param>,
) => Data | Promise<Data>;

export type QueryDataReplacer<Data> = (prev: Data | undefined, next: Data) => Data;

export interface QueryContextOptions<Data = unknown, Key extends QueryKey = QueryKey, Info = unknown> {
	fetch?: QueryFn<Data, Key, Info>;
	cache?: Map<string, QueryResult<any, any>>;
	staleTime?: number;
	cacheTime?: number;
	replaceData?: QueryDataReplacer<Data>;
	refetchOnMount?: boolean;
	refetchOnWindowFocus?: boolean;
	refetchOnReconnect?: boolean;
	refetchInterval?: number;
}

export interface QueryOptions<Data = unknown, Key extends QueryKey = QueryKey, Param = unknown>
	extends QueryContextOptions<Data, Key, Param> {
	key: Key;
	placeholderData?: Data;
}

export interface QueryActions<Data, Param> {
	refetch(force?: boolean, info?: Param): void | Promise<void>;
	mutate(data: Data): void;
}

export type QueryResource<Data, Param = unknown> = Accessor<QueryState<Data, Param>> &
	QueryActions<Data, Param>;

interface InternalQueryReturn<Data, Param = unknown> {
	query: QueryResult<Data, Param>;
}

export const defaultQueryOptions: QueryContextOptions = {
	cache: new Map(),
	staleTime: 3 * 1_000, // 3 seconds
	cacheTime: 2 * 1_000, // 2 seconds
	replaceData: replaceEqualDeep,
	refetchOnMount: true,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
};

export const QueryContext = createContext(defaultQueryOptions);

export const createQuery = <Data, Key extends QueryKey, Param = unknown>(
	options: () => QueryOptions<Data, Key, Param>,
): QueryResource<Data, Param> => {
	const parentOptions = useContext(QueryContext);

	const instance = createMemo(() => {
		const $options = options();
		const resolvedOptions = { ...parentOptions, ...$options };

		const {
			key,
			fetch,

			cache,
			placeholderData,

			staleTime,
			cacheTime,
			replaceData,
			refetchOnMount,
			refetchOnWindowFocus,
			refetchOnReconnect,
			refetchInterval,
		} = resolvedOptions;

		const hash = hashQueryKey(key);

		let query = cache!.get(hash) as QueryResult<Data, Param> | undefined;
		if (!query) {
			cache!.set(hash, (query = createQueryResult()));
		}

		const refetch = (force = false, param?: Param) => {
			const state = query!.state();

			if (force || state.invalidated || Date.now() - state.updatedAt > staleTime!) {
				return (query!.promise ||= (async () => {})());
			}
		};
	});
};
