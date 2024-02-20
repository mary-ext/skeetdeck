import type { Validator } from '../types.ts';

export const bigint: Validator<bigint> = (value, info) => {
	return typeof value === 'bigint' ? true : { code: 'invalid_type', path: info.path, expected: 'bigint' };
};
