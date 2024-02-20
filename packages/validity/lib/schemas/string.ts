import type { Validator } from '../types.ts';

export const string: Validator<string> = (value, info) => {
	return typeof value === 'string' ? true : { code: 'invalid_type', path: info.path, expected: 'string' };
};
