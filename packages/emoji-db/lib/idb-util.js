// helper functions that help compress the code better

const callStore = (store, method, key, cb) => {
	store[method](key).onsuccess = (e) => cb && cb(e.target.result);
};

export const getIDB = (store, key, cb) => {
	callStore(store, 'get', key, cb);
};

export const getAllIDB = (store, key, cb) => {
	callStore(store, 'getAll', key, cb);
};

export const commit = (txn) => {
	if (txn.commit) {
		txn.commit();
	}
};
