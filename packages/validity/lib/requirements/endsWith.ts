import type { Reqcuisitor } from '../types.ts';

export const endsWith = (substring: string): Reqcuisitor<string> => {
	return (value) => {
		return value.endsWith(substring) ? true : { code: 'starts_with', expected: substring };
	};
};
