import { extractTokens } from './utils/extractTokens.js';
import { findCommonMembers } from './utils/findCommonMembers.js';
import { normalizeTokens } from './utils/normalizeTokens.js';
import { transformEmojiData } from './utils/transformEmojiData.js';

import { transact } from './idb-lifecycle.js';
import { commit, getAllIDB, getIDB } from './idb-util.js';
import {
	INDEX_GROUP_AND_ORDER,
	INDEX_SKIN_UNICODE,
	INDEX_TOKENS,
	KEY_ETAG,
	KEY_URL,
	MODE_READONLY,
	MODE_READWRITE,
	STORE_EMOJI,
	STORE_KEYVALUE,
} from './constants.js';

export const isEmpty = async (db) => {
	return !(await get(db, STORE_KEYVALUE, KEY_URL));
};

export const hasData = async (db, url, eTag) => {
	const [oldETag, oldUrl] = await Promise.all([KEY_ETAG, KEY_URL].map((key) => get(db, STORE_KEYVALUE, key)));
	return oldETag === eTag && oldUrl === url;
};

const doFullDatabaseScanForSingleResult = async (db, predicate) => {
	// This batching algorithm is just a perf improvement over a basic
	// cursor. The BATCH_SIZE is an estimate of what would give the best
	// perf for doing a full DB scan (worst case).
	//
	// Mini-benchmark for determining the best batch size:
	//
	// PERF=1 yarn build:rollup && yarn test:adhoc
	//
	// (async () => {
	//   performance.mark('start')
	//   await $('emoji-picker').database.getEmojiByShortcode('doesnotexist')
	//   performance.measure('total', 'start')
	//   console.log(performance.getEntriesByName('total').slice(-1)[0].duration)
	// })()
	const BATCH_SIZE = 50; // Typically around 150ms for 6x slowdown in Chrome for above benchmark

	return transact(db, STORE_EMOJI, MODE_READONLY, (emojiStore, tx, cb) => {
		let lastKey;

		const processNextBatch = () => {
			emojiStore.getAll(lastKey && IDBKeyRange.lowerBound(lastKey, true), BATCH_SIZE).onsuccess = (e) => {
				const results = e.target.result;

				for (let idx = 0, len = results.length; idx < len; idx++) {
					const result = results[idx];
					lastKey = result.unicode;

					if (predicate(result)) {
						return cb(result);
					}
				}

				if (results.length < BATCH_SIZE) {
					return cb();
				}

				processNextBatch();
			};
		};

		processNextBatch();
	});
};

export const loadData = async (db, emojiData, url, eTag) => {
	const transformedData = transformEmojiData(emojiData);

	await transact(db, [STORE_EMOJI, STORE_KEYVALUE], MODE_READWRITE, ([emojiStore, metaStore], tx) => {
		let oldETag;
		let oldUrl;
		let todo = 0;

		const checkFetched = () => {
			if (++todo === 2) {
				// 2 requests made
				onFetched();
			}
		};

		const onFetched = () => {
			if (oldETag === eTag && oldUrl === url) {
				// check again within the transaction to guard against concurrency, e.g. multiple browser tabs
				return;
			}

			emojiStore.clear();
			for (let idx = 0, len = transformedData.length; idx < len; idx++) {
				const emoji = transformedData[idx];
				emojiStore.put(emoji);
			}

			metaStore.put(eTag, KEY_ETAG);
			metaStore.put(url, KEY_URL);
			commit(tx);
		};

		getIDB(metaStore, KEY_ETAG, (result) => {
			oldETag = result;
			checkFetched();
		});

		getIDB(metaStore, KEY_URL, (result) => {
			oldUrl = result;
			checkFetched();
		});
	});
};

export const getEmojiByGroup = async (db, group) => {
	return transact(db, STORE_EMOJI, MODE_READONLY, (emojiStore, tx, cb) => {
		const range = IDBKeyRange.bound([group, 0], [group + 1, 0], false, true);
		getAllIDB(emojiStore.index(INDEX_GROUP_AND_ORDER), range, cb);
	});
};

export const getEmojiBySearchQuery = async (db, query) => {
	const tokens = normalizeTokens(extractTokens(query));

	if (!tokens.length) {
		return [];
	}

	return transact(db, STORE_EMOJI, MODE_READONLY, (emojiStore, txn, cb) => {
		// get all results that contain all tokens (i.e. an AND query)
		const intermediateResults = [];

		const checkDone = () => {
			if (intermediateResults.length === tokens.length) {
				onDone();
			}
		};

		const onDone = () => {
			const results = findCommonMembers(intermediateResults, (_) => _.unicode);
			cb(results.sort((a, b) => (a.order < b.order ? -1 : 1)));
		};

		for (let i = 0; i < tokens.length; i++) {
			const token = tokens[i];
			const range =
				i === tokens.length - 1
					? IDBKeyRange.bound(token, token + '\uffff', false, true) // treat last token as a prefix search
					: IDBKeyRange.only(token); // treat all other tokens as an exact match

			getAllIDB(emojiStore.index(INDEX_TOKENS), range, (result) => {
				intermediateResults.push(result);
				checkDone();
			});
		}
	});
};

// This could have been implemented as an IDB index on shortcodes, but it seemed wasteful to do that
// when we can already query by tokens and this will give us what we're looking for 99.9% of the time
export const getEmojiByShortcode = async (db, shortcode) => {
	const emojis = await getEmojiBySearchQuery(db, shortcode);

	// In very rare cases (e.g. the shortcode "v" as in "v for victory"), we cannot search because
	// there are no usable tokens (too short in this case). In that case, we have to do an inefficient
	// full-database scan, which I believe is an acceptable tradeoff for not having to have an extra
	// index on shortcodes.

	if (!emojis.length) {
		const predicate = (_) => (_.shortcodes || []).includes(shortcode.toLowerCase());
		return (await doFullDatabaseScanForSingleResult(db, predicate)) || null;
	}

	return (
		emojis.filter((_) => {
			const lowerShortcodes = (_.shortcodes || []).map((_) => _.toLowerCase());
			return lowerShortcodes.includes(shortcode.toLowerCase());
		})[0] || null
	);
};

export const getEmojiByUnicode = async (db, unicode) => {
	return transact(db, STORE_EMOJI, MODE_READONLY, (emojiStore, txn, cb) =>
		getIDB(emojiStore, unicode, (result) => {
			if (result) {
				return cb(result);
			}
			getIDB(emojiStore.index(INDEX_SKIN_UNICODE), unicode, (result) => cb(result || null));
		}),
	);
};

export const get = (db, storeName, key) => {
	return transact(db, storeName, MODE_READONLY, (store, txn, cb) => getIDB(store, key, cb));
};

export const set = (db, storeName, key, value) => {
	return transact(db, storeName, MODE_READWRITE, (store, txn) => {
		store.put(value, key);
		commit(txn);
	});
};
