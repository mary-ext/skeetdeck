import { createSignal } from 'solid-js';

export function shouldThrowError<T extends (...args: Array<any>) => boolean>(
	throwError: boolean | T | undefined,
	params: Parameters<T>,
): boolean {
	// Allow throwError function to override throwing behavior on a per-error basis
	if (typeof throwError === 'function') {
		return throwError(...params);
	}

	return !!throwError;
}

export const createStateObject = <T extends Record<string, any>>(obj: T): T => {
	const state = {} as T;

	for (const key in obj) {
		const [value, setValue] = createSignal(obj[key]);

		Object.defineProperty(state, key, {
			get: value,
			set: (next) => setValue(typeof next === 'function' ? () => next : next),
		});
	}

	return state;
};
