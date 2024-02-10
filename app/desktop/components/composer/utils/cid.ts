import { encodeCbor } from '~/api/utils/cbor';
import { CBOR_CODE, createCID, formatCID } from '~/api/utils/cid';

// Sanity-check by requiring a $type here, this is because the records are
// expected to be encoded with it, even though the PDS accepts record writes
// without the field.
export const serializeRecordCid = async (record: { $type: string }) => {
	const bytes = encodeCbor(record);
	const cid = await createCID(CBOR_CODE, bytes);

	const serialized = formatCID(cid);

	return serialized;
};
