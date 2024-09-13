import type { At } from '@atcute/client/lexicons';

import { multiagent } from '../globals/agent';

interface BlobMetadata {
	u: At.DID;
	b: At.Blob;
}

const cache = new WeakMap<Blob, BlobMetadata>();

export const uploadBlob = async <T extends string = string>(uid: At.DID, blob: Blob): Promise<At.Blob<T>> => {
	let meta = cache.get(blob);

	if (!meta || meta.u !== uid) {
		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.call('com.atproto.repo.uploadBlob', { data: blob });

		cache.set(blob, (meta = { u: uid, b: response.data.blob }));
	}

	return meta.b as At.Blob<T>;
};

export const getUploadedBlob = <T extends string = string>(
	uid: At.DID,
	blob: Blob,
): At.Blob<T> | undefined => {
	const meta = cache.get(blob);
	return meta && meta.u === uid ? (meta.b as At.Blob<T>) : undefined;
};
