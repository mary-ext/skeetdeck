export const promisifyRequest = <T = undefined>(request: IDBRequest<T> | IDBTransaction): Promise<T> => {
	return new Promise<T>((resolve, reject) => {
		// @ts-ignore - file size hacks
		request.oncomplete = request.onsuccess = () => resolve(request.result);
		// @ts-ignore - file size hacks
		request.onabort = request.onerror = () => reject(request.error);
	});
};

export const createStore = (dbName: string, storeName: string) => {
	const request = indexedDB.open(dbName);
	request.onupgradeneeded = () => request.result.createObjectStore(storeName);

	const dbp = promisifyRequest(request);

	return <T>(mode: IDBTransactionMode, callback: (store: IDBObjectStore) => T | PromiseLike<T>) => {
		return dbp.then((db) => callback(db.transaction(storeName, mode).objectStore(storeName)));
	};
};

export type Store = ReturnType<typeof createStore>;

const RW = 'readwrite';

export const set = (store: Store, key: IDBValidKey, value: unknown) => {
	return store(RW, ($store) => {
		$store.put(value, key);
		return promisifyRequest($store.transaction);
	});
};

export const del = (store: Store, key: IDBValidKey) => {
	return store<void>(RW, ($store) => {
		$store.delete(key);
		return promisifyRequest($store.transaction);
	});
};

export const clear = (store: Store) => {
	return store<void>(RW, ($store) => {
		$store.clear();
		return promisifyRequest($store.transaction);
	});
};
