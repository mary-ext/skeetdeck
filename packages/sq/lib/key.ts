import { isPlainObject } from './utils.ts';

export type QueryKey = readonly unknown[];

const queryKeyReplacer = (_key: any, value: any) => {
	if (isPlainObject(value)) {
		const obj: typeof value = {};
		const keys = Object.keys(value).sort();

		for (let idx = 0, len = keys.length; idx < len; idx++) {
			const k = keys[idx];
			const v = value[k];

			obj[k] = v;
		}

		return obj;
	}

	return value;
};

export const hashQueryKey = (key: QueryKey) => {
	return JSON.stringify(key, queryKeyReplacer);
};
