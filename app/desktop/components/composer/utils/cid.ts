import { encode } from '@atcute/cbor';
import * as CID from '@atcute/cid';

// Sanity-check by requiring a $type here, this is because the records are
// expected to be encoded with it, even though the PDS accepts record writes
// without the field.
export const serializeRecordCid = async (record: { $type: string }) => {
	const bytes = encode(record);

	const cid = await CID.create(0x71, bytes);
	const serialized = CID.format(cid);

	return serialized;
};
