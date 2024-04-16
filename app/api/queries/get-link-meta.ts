import type { QueryFunctionContext as QC } from '@mary/solid-query';

import { compressPostImage } from '~/utils/image';
import { followAbortSignal } from '../utils/misc';

const LINK_PROXY_ENDPOINT = 'https://cardyb.bsky.app/v1/extract';

interface LinkProxyResponse {
	error: string;
	likely_type: string;
	url: string;
	title: string;
	description: string;
	image: string;
}

export interface LinkMeta {
	uri: string;
	title: string;
	description: string;
	thumb: Blob | undefined;
}

export const getLinkMetaKey = (url: string) => {
	return ['/getLinkMeta', url] as const;
};
export const getLinkMeta = async (ctx: QC<ReturnType<typeof getLinkMetaKey>>) => {
	const [, url] = ctx.queryKey;

	const response = await fetch(`${LINK_PROXY_ENDPOINT}?url=${encodeURIComponent(url)}`, {
		signal: followAbortSignal([ctx.signal, AbortSignal.timeout(5_000)]),
	});

	if (!response.ok) {
		throw new Error(`Failed to contact proxy: response error ${response.status}`);
	}

	const data = (await response.json()) as LinkProxyResponse;

	if (data.error != '') {
		throw new Error(`Proxy error: ${data.error}`);
	}

	let thumb: Blob | undefined;
	if (data.image != '') {
		try {
			const response = await fetch(data.image, {
				signal: followAbortSignal([ctx.signal, AbortSignal.timeout(10_000)]),
			});

			if (!response.ok) {
				throw new Error(`Failed to retrieve image: response error ${response.status}`);
			}

			const blob = await response.blob();
			const result = await compressPostImage(blob);

			thumb = result.blob;
		} catch {}
	}

	const meta: LinkMeta = {
		uri: url,
		title: data.title,
		description: data.description,
		thumb: thumb,
	};

	return meta;
};
