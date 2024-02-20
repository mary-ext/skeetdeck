import type { LiteralType, Validator } from '../types.ts';

export const literal = <T extends LiteralType>(lit: T): Validator<T> => {
	return (value, info) => {
		return value === lit ? true : { code: 'invalid_literal', path: info.path, expected: lit };
	};
};
