import { createRoot } from 'solid-js';

import { createLazyMemo } from '~/utils/hooks.ts';

import { segmentRichText } from './segmentize.ts';
import type { Facet } from './types.ts';

const TRIM_HOST_RE = /^www\./;
const TRIM_URLTEXT_RE = /^\s*(https?:\/\/)?(?:www\.)?/;
const PATH_MAX_LENGTH = 18;

export const toShortUrl = (uri: string): string => {
	try {
		const url = new URL(uri);
		const protocol = url.protocol;

		const host = url.host.replace(TRIM_HOST_RE, '');
		const pathname = url.pathname;

		const path = (pathname === '/' ? '' : pathname) + url.search + url.hash;

		if (protocol === 'http:' || protocol === 'https:') {
			if (path.length > PATH_MAX_LENGTH) {
				return host + path.slice(0, PATH_MAX_LENGTH - 1) + '…';
			}

			return host + path;
		}
	} catch {}

	return uri;
};

const buildHostPart = (url: URL) => {
	const username = url.username;
	// const password = url.password;

	const hostname = url.hostname.replace(TRIM_HOST_RE, '').toLowerCase();
	const port = url.port;

	// const auth = username ? username + (password ? ':' + password : '') + '@' : '';

	// Perhaps might be best if we always warn on authentication being passed.
	const auth = username ? '\0@@\0' : '';
	const host = hostname + (port ? ':' + port : '');

	return auth + host;
};

export const isLinkValid = (uri: string, text: string) => {
	let url: URL;
	let protocol: string;
	try {
		url = new URL(uri);
		protocol = url.protocol;

		if (protocol !== 'https:' && protocol !== 'http:') {
			return false;
		}
	} catch {
		return false;
	}

	const expectedHost = buildHostPart(url);
	const length = expectedHost.length;

	const normalized = text.replace(TRIM_URLTEXT_RE, '').toLowerCase();
	const normalizedLength = normalized.length;

	const boundary = normalizedLength >= length ? normalized[length] : undefined;

	return (
		(!boundary || boundary === '/' || boundary === '?' || boundary === '#') &&
		normalized.startsWith(expectedHost)
	);
};

export interface RtReturn {
	t: string;
	f: Facet[] | undefined;
}

export const createRichTextSegmenter = (accessor: () => RtReturn) => {
	return createRoot(() => {
		return createLazyMemo(() => {
			const { t: text, f: facets } = accessor();

			return segmentRichText(text, facets);
		});
	});
};
