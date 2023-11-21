import { cleanEmoji } from './utils/cleanEmoji.js';
import { uniqEmoji } from './utils/uniqEmoji.js';

import { loadDataForFirstTime, checkForUpdates } from './data.js';
import { closeDatabase, deleteDatabase, addOnCloseListener, openDatabase } from './idb-lifecycle.js';
import {
	isEmpty,
	getEmojiByGroup,
	getEmojiBySearchQuery,
	getEmojiByShortcode,
	getEmojiByUnicode,
	get,
	set,
} from './idb-interface.js';
import { DEFAULT_SOURCE_URL, DEFAULT_LOCALE, KEY_PREFERRED_SKINTONE, STORE_KEYVALUE } from './constants.js';

export default class Database {
	/** @type {string} */
	sourceUrl;
	/** @type {string} */
	locale;

	/** @type {string} */
	#dbName;
	/** @type {IDBDatabase | undefined} */
	#db;
	/** @type {Promise<void> | undefined} */
	#lazyUpdate;

	/** @type {Promise<void>} */
	#ready;

	constructor({ sourceUrl = DEFAULT_SOURCE_URL, locale = DEFAULT_LOCALE } = {}) {
		this.sourceUrl = sourceUrl;
		this.locale = locale;

		this.#dbName = `emoji-picker-element-${this.locale}`;
		this.#ready = this.#init();
	}

	// clear references to IDB, e.g. during a close event
	#clear = () => {
		// We don't need to call removeEventListener or remove the manual "close" listeners.
		// The memory leak tests prove this is unnecessary. It's because:
		// 1) IDBDatabases that can no longer fire "close" automatically have listeners GCed
		// 2) we clear the manual close listeners in idb-lifecycle.js.
		this.#db = this.#ready = this.#lazyUpdate = undefined;
	};

	async #init() {
		const db = (this.#db = await openDatabase(this.#dbName));

		addOnCloseListener(this.#dbName, this.#clear);
		const dataSource = this.sourceUrl;
		const empty = await isEmpty(db);

		if (empty) {
			await loadDataForFirstTime(db, dataSource);
		} else {
			// offline-first - do an update asynchronously
			this.#lazyUpdate = checkForUpdates(db, dataSource);
		}
	}

	async #shutdown() {
		await this.ready(); // reopen if we've already been closed/deleted

		try {
			await this.#lazyUpdate; // allow any lazy updates to process before closing/deleting
		} catch (err) {
			/* ignore network errors (offline-first) */
		}
	}

	async ready() {
		const checkReady = async () => {
			if (!this.#ready) {
				this.#ready = this.#init();
			}
			return this.#ready;
		};

		await checkReady();

		// There's a possibility of a race condition where the element gets added, removed, and then added again
		// with a particular timing, which would set the _db to undefined.
		// We *could* do a while loop here, but that seems excessive and could lead to an infinite loop.
		if (!this.#db) {
			await checkReady();
		}
	}

	async getEmojiByGroup(group) {
		await this.ready();
		return uniqEmoji(await getEmojiByGroup(this.#db, group)).map(cleanEmoji);
	}

	async getEmojiBySearchQuery(query) {
		await this.ready();
		return uniqEmoji(await getEmojiBySearchQuery(this.#db, query)).map(cleanEmoji);
	}

	async getEmojiByShortcode(shortcode) {
		await this.ready();
		return cleanEmoji(await getEmojiByShortcode(this.#db, shortcode));
	}

	async getEmojiByUnicode(unicode) {
		await this.ready();
		return cleanEmoji(await getEmojiByUnicode(this.#db, unicode));
	}

	async getPreferredSkinTone() {
		await this.ready();
		return (await get(this.#db, STORE_KEYVALUE, KEY_PREFERRED_SKINTONE)) || 0;
	}

	async setPreferredSkinTone(skinTone) {
		await this.ready();
		await set(this.#db, STORE_KEYVALUE, KEY_PREFERRED_SKINTONE, skinTone);
	}

	async close() {
		await this.#shutdown();
		await closeDatabase(this.#dbName);
	}

	async delete() {
		await this.#shutdown();
		await deleteDatabase(this.#dbName);
	}
}
