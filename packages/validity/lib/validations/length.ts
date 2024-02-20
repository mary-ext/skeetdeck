import type { Recquisition } from '../types.ts';

export const length = (min: number, max: number): Recquisition<string | unknown[]> => {
	return (value) => {
		const length = value.length;
		return length >= min && length <= max ? true : { code: 'length', min: min, max: max };
	};
};
