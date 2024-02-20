import type { Reqcuisitor } from '../types.ts';

export const length = (min: number, max: number): Reqcuisitor<string | unknown[]> => {
	return (value) => {
		const length = value.length;
		return length >= min && length <= max ? true : { code: 'length', min: min, max: max };
	};
};
