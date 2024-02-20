import type { Validator } from '../types.ts';

export const boolean: Validator<boolean> = (value, info) => {
	return typeof value === 'boolean' ? true : { code: 'invalid_type', path: info.path, expected: 'boolean' };
};
