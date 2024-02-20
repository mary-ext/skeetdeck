import type { Validator } from '../types.ts';

export const undefined_: Validator<undefined> = (value: unknown, info) => {
	return value === undefined ? true : { code: 'invalid_type', path: info.path, expected: 'undefined' };
};
