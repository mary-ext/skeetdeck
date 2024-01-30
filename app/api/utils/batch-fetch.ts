// we would sometimes rely on fetching multiple individual posts, and it would
// be preferrable if it can be batched.

type Promisable<T> = T | Promise<T>;

interface Deferred<T> {
	promise: Promise<T>;
	resolve(value: T | PromiseLike<T>): void;
	reject(reason?: any): void;
}

const createDeferred = <T>(): Deferred<T> => {
	const deferred: any = {};

	deferred.promise = new Promise((resolve, reject) => {
		deferred.resolve = resolve;
		deferred.reject = reject;
	});

	return deferred;
};

export type QueryId = string | number;

export interface BatchedFetchOptions<Query, Id extends QueryId, Data> {
	limit: number;
	timeout: number;
	fetch: (queries: Query[]) => Promisable<Data[]>;
	key: (query: Query) => string | number;
	idFromQuery: (query: Query) => Id;
	idFromData: (data: Data) => Id;
}

interface BatchedFetchMap<Query, Id, Data> {
	key: string | number;
	timeout: any;
	queries: Query[];
	pending: Map<Id, Deferred<Data>>;
}

export class ResourceMissingError extends Error {
	name = 'ResourceMissingError';
}

/*#__NO_SIDE_EFFECTS__*/
export const createBatchedFetch = <Query, Id extends QueryId, Data>(
	options: BatchedFetchOptions<Query, Id, Data>,
) => {
	const { limit, timeout, fetch, key: _key, idFromData, idFromQuery } = options;

	let curr: BatchedFetchMap<Query, Id, Data> | undefined;

	return (query: Query): Promise<Data> => {
		const id = idFromQuery(query);
		const key = _key(query);

		let map = curr;

		if (!map || map.queries.length >= limit || map.key !== key) {
			map = curr = {
				key,
				timeout: undefined,
				queries: [],
				pending: new Map(),
			};
		}

		let deferred = map.pending.get(id);

		if (!deferred) {
			deferred = createDeferred<Data>();

			map.queries.push(query);
			map.pending.set(id, deferred);
		}

		clearTimeout(map.timeout);

		map.timeout = setTimeout(() => {
			if (curr === map) {
				curr = undefined;
			}

			perform(map!, fetch, idFromData);
		}, timeout);

		return deferred.promise;
	};
};

const perform = async <Query, Id extends QueryId, Data>(
	map: BatchedFetchMap<Query, Id, Data>,
	fetch: (queries: Query[]) => Promisable<Data[]>,
	idFromData: (data: Data) => Id,
) => {
	const queries = map.queries;
	const pending = map.pending;

	let errored = false;

	try {
		const dataset = await fetch(queries);

		for (const data of dataset) {
			const id = idFromData(data);
			const deferred = pending.get(id);

			deferred?.resolve(data);
		}
	} catch (error) {
		errored = true;

		for (const deferred of pending.values()) {
			deferred.reject(error);
		}
	} finally {
		if (!errored) {
			for (const deferred of pending.values()) {
				deferred.reject(new ResourceMissingError());
			}
		}
	}
};
