import * as cborg from 'cborg';

import { assert } from '~/utils/misc';

import * as base32 from './base32';

const decodeCidToBytes = (source: string) => {
	// Make sure we're dealing with serialized base32 here.
	assert(source[0] === 'b');

	const str = source.slice(1);
	return base32.decode(str);
};

const CBORG_ENCODE_OPTIONS: cborg.EncodeOptions = {
	float64: true,
	typeEncoders: {
		number: (num) => {
			if (Number.isNaN(num)) {
				throw new Error('NaN values not supported');
			}
			if (num === Infinity || num === -Infinity) {
				throw new Error('Infinity values not supported');
			}

			return null;
		},
		undefined: () => {
			throw new Error(`undefined values not supported`);
		},
		Object: (val) => {
			if ('$link' in val && typeof val.$link === 'string') {
				const cid = decodeCidToBytes(val.$link);

				// CID bytes are prefixed with 0x00 for historical reasons, apparently.
				const bytes = new Uint8Array(cid.byteLength + 1);
				bytes.set(cid, 1);

				return [new cborg.Token(cborg.Type.tag, 42), new cborg.Token(cborg.Type.bytes, bytes)];
			}

			return null;
		},
	},
};

export const encodeCbor = (data: any) => {
	return cborg.encode(data, CBORG_ENCODE_OPTIONS);
};
