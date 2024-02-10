import type { AtBlob, DID } from '../atp-schema';
import { multiagent } from '../globals/agent';

interface BlobMetadata {
	u: DID;
	b: AtBlob;
}

const cache = new WeakMap<Blob, BlobMetadata>();

export const uploadBlob = async <T extends string = string>(uid: DID, blob: Blob): Promise<AtBlob<T>> => {
	let meta = cache.get(blob);

	if (!meta || meta.u !== uid) {
		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.call('com.atproto.repo.uploadBlob', {
			data: blob,
			encoding: blob.type,
		});

		cache.set(blob, (meta = { u: uid, b: response.data.blob }));
	}

	return meta.b as AtBlob<T>;
};

export const getUploadedBlob = <T extends string = string>(uid: DID, blob: Blob): AtBlob<T> | undefined => {
	const meta = cache.get(blob);
	return meta && meta.u === uid ? (meta.b as AtBlob<T>) : undefined;
};
