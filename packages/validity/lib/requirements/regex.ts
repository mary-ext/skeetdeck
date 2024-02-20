import type { Reqcuisitor } from '../types.ts';

export const regex = (matcher: RegExp): Reqcuisitor<string> => {
	let str: string | undefined;

	return (value) => {
		return matcher.test(value) ? true : { code: 'regex', expected: (str ??= '' + matcher) };
	};
};
