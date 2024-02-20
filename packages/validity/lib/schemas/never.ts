import type { Validator } from '../types.ts';

export const never: Validator<never> = (_value, info) => {
	return { code: 'invalid_type', path: info.path, expected: null };
};
