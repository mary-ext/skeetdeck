import { assertEmojiData } from './assertEmojiData.js';

/**
 * @param {Response} response
 * @param {string} url
 */
const assertStatus = (response, url) => {
	if (!response.ok) {
		throw new Error('Failed to fetch: ' + url + ':  ' + response.status);
	}
};

export const getEtag = async (sourceUrl) => {
	const response = await fetch(sourceUrl, { method: 'HEAD' });
	assertStatus(response, sourceUrl);

	const etag = response.headers.get('etag');
	return etag;
};

export const getEtagAndData = async (sourceUrl) => {
	const response = await fetch(sourceUrl);
	assertStatus(response, sourceUrl);

	const etag = response.headers.get('etag');
	const data = await response.json();

	assertEmojiData(data);
	return [etag, data];
};
