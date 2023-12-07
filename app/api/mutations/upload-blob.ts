import type { AtBlob, DID } from '../atp-schema.ts';
import { multiagent } from '../globals/agent.ts';

const cache = new WeakMap<Blob, AtBlob>();

export const uploadBlob = async <T extends string = string>(uid: DID, blob: Blob): Promise<AtBlob<T>> => {
	let atblob = cache.get(blob);

	if (!atblob) {
		const agent = await multiagent.connect(uid);

		const response = await agent.rpc.call('com.atproto.repo.uploadBlob', {
			data: blob,
			encoding: blob.type,
		});

		cache.set(blob, (atblob = response.data.blob));
	}

	return atblob as AtBlob<T>;
};
