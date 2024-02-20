import type { Reqcuisitor } from '../types.ts';

export const startsWith = (substring: string): Reqcuisitor<string> => {
	return (value) => {
		return value.startsWith(substring) ? true : { code: 'starts_with', expected: substring };
	};
};
