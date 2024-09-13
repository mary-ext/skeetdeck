import { DB_VERSION_CURRENT, DB_VERSION_INITIAL } from './constants.js';
import { initialMigration } from './migrations.js';

/** @type {Record<string, IDBOpenDBRequest>} */
const requests = {};
/** @type {Record<string, Promise<IDBDatabase>>} */
const databases = {};
/** @type {Record<string, Array<() => void> | (() => void)>} */
const closeListeners = {};

/**
 * @param {IDBOpenDBRequest} req
 * @param {(value: IDBDatabase) => void} resolve
 * @param {(reason: any) => void} reject
 */
const attachPromises = (req, resolve, reject) => {
	req.onerror = () => reject(req.error);
	req.onblocked = () => reject(new Error('IDB blocked'));
	req.onsuccess = () => resolve(req.result);
};

/**
 * @param {string} dbName
 * @returns {Promise<IDBDatabase>}
 */
const createDatabase = async (dbName) => {
	const db = await new Promise((resolve, reject) => {
		const req = indexedDB.open(dbName, DB_VERSION_CURRENT);
		requests[dbName] = req;

		req.onupgradeneeded = (e) => {
			// Technically there is only one version, so we don't need this `if` check
			// But if an old version of the JS is in another browser tab
			// and it gets upgraded in the future and we have a new DB version, well...
			// better safe than sorry.
			if (e.oldVersion < DB_VERSION_INITIAL) {
				initialMigration(req.result);
			}
		};

		attachPromises(req, resolve, reject);
	});

	// Handle abnormal closes, e.g. "delete database" in chrome dev tools.
	// No need for removeEventListener, because once the DB can no longer
	// fire "close" events, it will auto-GC.
	db.onclose = () => closeDatabase(dbName);
	return db;
};

export const openDatabase = (dbName) => {
	return (databases[dbName] ||= createDatabase(dbName));
};

/**
 * @template TReturn
 * @template {string | string[]} TStore
 * @param {IDBDatabase} db
 * @param {TStore} storeName
 * @param {IDBTransactionMode} mode
 * @param {(stores: TStore extends string[] ? IDBObjectStore[] : IDBObjectStore, tx: IDBTransaction, callback: (value: TReturn) => void)} cb
 * @returns {Promise<TReturn>}
 */
export const transact = (db, storeName, mode, cb) => {
	return new Promise((resolve, reject) => {
		// Use relaxed durability because neither the emoji data nor the favorites/preferred skin tone
		// are really irreplaceable data. IndexedDB is just a cache in this case.
		const tx = db.transaction(storeName, mode, { durability: 'relaxed' });

		const store =
			typeof storeName === 'string'
				? tx.objectStore(storeName)
				: storeName.map((name) => tx.objectStore(name));

		let res;
		cb(store, tx, (result) => {
			res = result;
		});

		tx.oncomplete = () => resolve(res);
		tx.onerror = () => reject(tx.error);
	});
};

export const closeDatabase = (dbName) => {
	// close any open requests
	const req = requests[dbName];
	const db = req && req.result;

	if (db) {
		const listeners = closeListeners[dbName];

		db.close();

		if (listeners) {
			if (Array.isArray(listeners)) {
				for (let idx = 0, len = listeners.length; idx < len; idx++) {
					const listener = listeners[idx];
					listener();
				}
			} else {
				listeners();
			}
		}
	}

	delete requests[dbName];
	delete databases[dbName];
	delete closeListeners[dbName];
};

export const deleteDatabase = (dbName) => {
	return new Promise((resolve, reject) => {
		// close any open requests
		closeDatabase(dbName);

		const req = indexedDB.deleteDatabase(dbName);
		attachPromises(req, resolve, reject);
	});
};

// The "close" event occurs during an abnormal shutdown, e.g. a user clearing their browser data.
// However, it doesn't occur with the normal "close" event, so we handle that separately.
// https://www.w3.org/TR/IndexedDB/#close-a-database-connection
export const addOnCloseListener = (dbName, listener) => {
	let existing = closeListeners[dbName];

	if (Array.isArray(existing)) {
		existing.push(listener);
	} else if (existing) {
		closeListeners[dbName] = [existing, listener];
	} else {
		closeListeners[dbName] = listener;
	}
};
