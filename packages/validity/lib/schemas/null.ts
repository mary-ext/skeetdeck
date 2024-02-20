import type { Validator } from '../types.ts';

export const null_: Validator<null> = (value, info) => {
	return typeof value === null ? true : { code: 'invalid_type', path: info.path, expected: 'null' };
};
