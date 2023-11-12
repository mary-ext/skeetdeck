import { $PROXY } from 'solid-js';
import type { DID } from '~/api/atp-schema.ts';

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

/**
 * Tanstack's Solid Query puts the query data in a Solid.js' store, which
 * prevents mutation, but we don't want it to be in a store to begin with, as
 * we're dealing with objects that has signals inside of it.
 */
export const markRaw = <T extends object>(value: T): T => {
	// Solid.js sets a $PROXY property on the object as a way to retrieve existing
	// proxies for an object, so we're just gonna set it ourselves.

	// @ts-expect-error
	value[$PROXY] = value;

	return value;
};
