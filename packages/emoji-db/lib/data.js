import { hasData, loadData } from './idb-interface.js';
import { getEtag, getEtagAndData } from './utils/ajax.js';
import { jsonChecksum } from './utils/jsonChecksum.js';

export const checkForUpdates = async (db, dataSource) => {
	// just do a simple HEAD request first to see if the eTags match
	let emojiData;
	let eTag = await getEtag(dataSource);

	if (!eTag) {
		// work around lack of ETag/Access-Control-Expose-Headers
		const eTagAndData = await getEtagAndData(dataSource);
		eTag = eTagAndData[0];
		emojiData = eTagAndData[1];
		if (!eTag) {
			eTag = await jsonChecksum(emojiData);
		}
	}

	if (await hasData(db, dataSource, eTag)) {
		// Already populated
	} else {
		// Looks like we have an update
		if (!emojiData) {
			const eTagAndData = await getEtagAndData(dataSource);
			emojiData = eTagAndData[1];
		}
		await loadData(db, emojiData, dataSource, eTag);
	}
};

export const loadDataForFirstTime = async (db, dataSource) => {
	let [eTag, emojiData] = await getEtagAndData(dataSource);

	if (!eTag) {
		// Handle lack of support for ETag or Access-Control-Expose-Headers
		// https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Access-Control-Expose-Headers#Browser_compatibility
		eTag = await jsonChecksum(emojiData);
	}

	await loadData(db, emojiData, dataSource, eTag);
};
