import type { Validator } from '../types.ts';

export const unknown: Validator<unknown> = (_value: unknown) => {
	return true;
};
