import type { Validator } from '../types.ts';

export const number: Validator<number> = (value, info) => {
	return typeof value === 'number' ? true : { code: 'invalid_type', path: info.path, expected: 'number' };
};
