import type { DID } from '../atp-schema.ts';

export const isDid = (value: string): value is DID => {
	return value.startsWith('did:');
};

export const getRecordId = (uri: string) => {
	const idx = uri.lastIndexOf('/');
	return uri.slice(idx + 1);
};

export const getCollectionId = (uri: string) => {
	const first = uri.indexOf('/', 5);
	const second = uri.indexOf('/', first + 1);

	return uri.slice(first + 1, second);
};

export const getRepoId = (uri: string) => {
	const idx = uri.indexOf('/', 5);
	return uri.slice(5, idx);
};

export const getCurrentDate = () => {
	const date = new Date();
	date.setMilliseconds(0);

	return date.toISOString();
};
