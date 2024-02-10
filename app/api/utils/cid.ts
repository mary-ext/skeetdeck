import * as varint from './varint';
import * as base32 from './base32';

export const CBOR_CODE = 0x71;

interface Digest {
	code: number;
	size: number;
	digest: Uint8Array;
	bytes: Uint8Array;
}

interface CID {
	version: number;
	code: number;
	digest: Digest;
	bytes: Uint8Array;
}

/**
 * Creates a CID according to ATProto's blessed format, a SHA256-hashed v1.
 */
export const createCID = async (code: number, input: Uint8Array): Promise<CID> => {
	const digest = createDigest(0x12, new Uint8Array(await crypto.subtle.digest('sha-256', input)));
	const bytes = encodeCID(1, code, digest.bytes);

	return {
		version: 1,
		code: code,
		digest: digest,
		bytes: bytes,
	};
};

export const formatCID = (cid: CID) => {
	return 'b' + base32.encode(cid.bytes);
};

const createDigest = (code: number, digest: Uint8Array): Digest => {
	const size = digest.byteLength;
	const sizeOffset = varint.encodingLength(code);
	const digestOffset = sizeOffset + varint.encodingLength(size);

	const bytes = new Uint8Array(digestOffset + size);
	varint.encode(code, bytes, 0);
	varint.encode(size, bytes, sizeOffset);
	bytes.set(digest, digestOffset);

	return {
		code: code,
		size: size,
		digest: digest,
		bytes: bytes,
	};
};

const encodeCID = (version: number, code: number, multihash: Uint8Array) => {
	const codeOffset = varint.encodingLength(version);
	const hashOffset = codeOffset + varint.encodingLength(code);

	const bytes = new Uint8Array(hashOffset + multihash.byteLength);
	varint.encode(version, bytes, 0);
	varint.encode(code, bytes, codeOffset);
	bytes.set(multihash, hashOffset);

	return bytes;
};
