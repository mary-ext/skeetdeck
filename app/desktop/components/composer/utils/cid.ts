import * as CID from '@mary/atproto-cid';

import { encodeCbor } from '~/api/utils/cbor';

// Sanity-check by requiring a $type here, this is because the records are
// expected to be encoded with it, even though the PDS accepts record writes
// without the field.
export const serializeRecordCid = async (record: { $type: string }) => {
	const bytes = encodeCbor(prepareObject(record));
	const cid = await CID.create(0x71, bytes);

	const serialized = CID.format(cid);

	return serialized;
};

// This function prepares objects for hashing by removing fields with undefined
// values, as CBOR has an undefined type while JSON doesn't.
const prepareObject = (v: any): any => {
	// Walk through arrays
	if (isArray(v)) {
		let pure = true;

		const mapped = v.map((value) => {
			if (value !== (value = prepareObject(value))) {
				pure = false;
			}

			return value;
		});

		return pure ? v : mapped;
	}

	// Walk through plain objects
	if (isPlainObject(v)) {
		const obj: any = {};

		let pure = true;

		for (const key in v) {
			let value = v[key];

			// `value` is undefined
			if (value === undefined) {
				pure = false;
				continue;
			}

			// `prepareObject` returned a value that's different from what we had before
			if (value !== (value = prepareObject(value))) {
				pure = false;
			}

			obj[key] = value;
		}

		// Return as is if we haven't needed to tamper with anything
		return pure ? v : obj;
	}

	return v;
};

const isArray = Array.isArray;

const isPlainObject = (v: any): boolean => {
	if (typeof v !== 'object' || v === null) {
		return false;
	}

	const proto = Object.getPrototypeOf(v);
	return proto === Object.prototype || proto === null;
};
