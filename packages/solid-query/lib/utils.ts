import { createSignal } from 'solid-js';

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
