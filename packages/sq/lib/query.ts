import {
	type Resource,
	batch,
	createContext,
	createMemo,
	createResource,
	onCleanup,
	startTransition,
	useContext,
} from 'solid-js';

import { makeEventListener } from '@solid-primitives/event-listener';

import { type QueryKey, hashQueryKey } from './key.ts';
import { type Ref, noop, ref, replaceEqualDeep } from './utils.ts';

export class QueryResult<Data> {
	/** @internal */
	public _fetch = 0;
	/** @internal */
	public _fresh = true;
	/** @internal */
	public _loading = false;

	/** @internal */
	public _promise: Ref<Promise<Data>>;
	/** @internal */
	public _refetchParam: Ref<unknown> = ref<unknown>(undefined);

	/** @internal */
	public _uses = 0;
	/** @internal */
	public _timeout?: any;

	constructor(
		public key: QueryKey,
		public value?: Data,
		public updatedAt = -1,
	) {
		this._promise = ref(value !== undefined ? Promise.resolve(value) : new Promise(noop));
	}
}

export interface QueryInfo<Data, Param = unknown> {
	data: Data | undefined;
	param: Param | undefined;
}

export type QueryKeyFn<Key extends QueryKey = QueryKey> = () => Key | false | undefined | null;

export type QueryFn<Data, Key extends QueryKey = QueryKey, Param = unknown> = (
	key: Key,
	info: QueryInfo<Data, Param>,
) => Data | Promise<Data>;

export type QueryDataReplacer<Data> = (prev: Data | undefined, next: Data) => Data;

export interface QueryContextOptions<Data = unknown, Key extends QueryKey = QueryKey, Info = unknown> {
	fetch?: QueryFn<Data, Key, Info>;
	cache?: Map<string, QueryResult<any>>;
	staleTime?: number;
	cacheTime?: number;
	replaceData?: QueryDataReplacer<Data>;
	refetchOnMount?: boolean;
	refetchOnWindowFocus?: boolean;
	refetchOnReconnect?: boolean;
	refetchInterval?: number;
	throwOnAccess?: boolean;
}

export interface InitialDataReturn<Data> {
	data: Data;
	updatedAt?: number;
}

export type InitialDataFn<Data, Key extends QueryKey> = (key: Key) => InitialDataReturn<Data> | undefined;

export interface QueryOptions<Data = unknown, Key extends QueryKey = QueryKey, Param = unknown>
	extends QueryContextOptions<Data, Key, Param> {
	key: QueryKeyFn<Key>;
	initialData?: InitialDataFn<Data, Key>;
}

export interface QueryActions<Data, Param> {
	refetch(force?: boolean, info?: Param): void | Promise<void>;
	mutate(data: Data): void;
}

export type EnhancedResource<Data, Param = unknown> = Resource<Data> & { refetchParam: Param | undefined };
export type QueryReturn<Data, Param> = [EnhancedResource<Data, Param>, QueryActions<Data, Param>];

interface InternalQueryReturn<Data, Param> {
	_resource: Resource<Data>;
	_refetchParam: () => Param | undefined;

	_refetch: QueryActions<Data, Param>['refetch'];
	_mutate: QueryActions<Data, Param>['mutate'];
}

export const defaultQueryOptions: QueryContextOptions = {
	cache: new Map(),
	staleTime: 3 * 1_000, // 3 seconds
	cacheTime: 2 * 1_000, // 2 seconds
	replaceData: replaceEqualDeep,
	refetchOnMount: true,
	refetchOnWindowFocus: false,
	refetchOnReconnect: false,
	throwOnAccess: false,
};

export const QueryContext = createContext(defaultQueryOptions);

export const createQuery = <Data, Key extends QueryKey, Param = unknown>(
	options: QueryOptions<Data, Key, Param>,
): QueryReturn<Data, Param> => {
	const resolvedOptions: QueryOptions<Data, Key> = { ...(useContext(QueryContext) as any), ...options };

	const {
		key,
		fetch,

		cache,
		initialData,

		staleTime,
		cacheTime,
		replaceData,
		refetchOnMount,
		refetchOnWindowFocus,
		refetchOnReconnect,
		refetchInterval,

		throwOnAccess,
	} = resolvedOptions;

	const source = createMemo(
		() => {
			const $key = key();
			if ($key) {
				return { _key: $key, _hash: hashQueryKey($key) };
			}
		},
		undefined,
		{ equals: (a, b) => a?._hash === b?._hash },
	);

	const instance = createMemo((): InternalQueryReturn<Data, Param> => {
		const $source = source();

		if (!$source) {
			// @ts-expect-error
			const [resource] = createResource<Data, false>(false, noop);

			return {
				_resource: resource,
				_refetchParam: noop as () => Param | undefined,
				_refetch: noop,
				_mutate: noop,
			};
		}

		const key = $source._key;
		const hash = $source._hash;

		let query = cache!.get(hash);

		if (!query) {
			const result = initialData?.(key);

			if (result) {
				query = new QueryResult(key, result.data, result.updatedAt);
			} else {
				query = new QueryResult<Data>(key);
			}

			cache!.set(hash, query);
		}

		const [read] = createResource<Data, Promise<Data>>(
			() => query!._promise._value,
			($promise) => $promise,
			query!.value !== undefined ? { initialValue: query!.value } : {},
		);

		const refetch = (force = false, info?: unknown) => {
			if (force || query!._fresh || (!query!._loading && Date.now() - query!.updatedAt > staleTime!)) {
				const id = ++query!._fetch;

				const promise = (async () => {
					let errored = false;
					let value: unknown;

					try {
						const prev = query!.value;
						const next = await fetch!(key, { data: prev, param: info });

						const replaced = replaceData!(prev, next);

						value = replaced;
					} catch (err) {
						errored = true;
						value = err;
					}

					if (query!._fetch === id) {
						if (errored) {
							query!._fresh = true;
						} else {
							query!.value = value as Data;
							query!.updatedAt = Date.now();
						}

						query!._loading = false;
					}

					if (errored) {
						throw value;
					} else {
						return value as Data;
					}
				})();

				batch(() => {
					query!._refetchParam._value = info;
					query!._promise._value = promise;

					query!._fresh = false;
					query!._loading = true;
				});

				return promise.then(noop, noop);
			}
		};

		const mutate = (data: Data) => {
			return batch(() => {
				query!._promise._value = Promise.resolve(data);
				query!._refetchParam._value = undefined;

				query!._fetch++;
				query!._fresh = false;
				query!._loading = false;

				query!.value = data;
				query!.updatedAt = Date.now();
			});
		};

		const refetchWithTransition = () => {
			return startTransition(refetch);
		};

		clearTimeout(query._timeout);
		query._uses++;

		if (refetchOnMount || query!._fresh) {
			queueMicrotask(refetchWithTransition);
		}
		if (refetchOnWindowFocus) {
			makeEventListener(window, 'visibilitychange', refetchWithTransition);
			makeEventListener(window, 'focus', refetchWithTransition);
		}
		if (refetchOnReconnect) {
			makeEventListener(window, 'online', refetchWithTransition);
		}
		if (refetchInterval !== undefined) {
			const interval = setInterval(refetchWithTransition, refetchInterval);
			onCleanup(() => clearInterval(interval));
		}

		onCleanup(() => {
			if (--query!._uses < 1) {
				query!._timeout = setTimeout(() => cache!.delete(hash), cacheTime!);
			}
		});

		return {
			_resource: read as EnhancedResource<Data, Param>,
			_refetchParam: () => query!._refetchParam._value as Param | undefined,
			_refetch: refetch,
			_mutate: mutate,
		};
	});

	const read = () => {
		const resource = instance()._resource;
		return throwOnAccess || !resource.error ? resource() : undefined;
	};

	Object.defineProperties(read, {
		state: {
			get: () => instance()._resource.state,
		},
		error: {
			get: () => instance()._resource.error,
		},
		loading: {
			get: () => instance()._resource.loading,
		},
		latest: {
			get: () => {
				const resource = instance()._resource;
				return throwOnAccess || !resource.error ? resource.latest : undefined;
			},
		},
		refetchParam: {
			get: () => instance()._refetchParam(),
		},
	});

	return [
		read as EnhancedResource<Data, Param>,
		{
			refetch: (force, info) => instance()._refetch(force, info),
			mutate: (data) => instance()._mutate(data),
		},
	];
};

export const useQueryMutation = () => {
	const context = useContext(QueryContext)!;
	const cache = context.cache!;

	const mutateQuery = (query: QueryResult<any>, invalidate: boolean, data: any | ((prev: any) => any)) => {
		const prev = query.value;
		const next = typeof data === 'function' ? data(prev) : data;

		query!._promise._value = next !== undefined ? Promise.resolve(next) : new Promise(noop);
		query!._refetchParam._value = undefined;

		query!._fetch++;
		query!._fresh = false;
		query!._loading = false;
		query!._fresh = invalidate;

		query!.value = next;
		query!.updatedAt = Date.now();
	};

	const mutate = (
		invalidate: boolean,
		key: QueryKey | ((key: QueryKey) => boolean),
		data: any | ((prev: any) => any),
	) => {
		return batch(() => {
			if (typeof key === 'function') {
				for (const query of cache.values()) {
					if (!key(query.key)) {
						continue;
					}

					mutateQuery(query, invalidate, data);
				}
			} else {
				const len = key.length;

				loop: for (const query of cache.values()) {
					const qKey = query.key;

					if (qKey.length < len) {
						continue loop;
					}

					for (let idx = 0; idx < len; idx++) {
						if (qKey[idx] !== key[idx]) {
							continue loop;
						}
					}

					mutateQuery(query, invalidate, data);
				}
			}
		});
	};

	return mutate;
};
