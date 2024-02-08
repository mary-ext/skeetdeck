import { createSignal } from 'solid-js';

export const useEntryState = <T = {}>(): [() => Partial<T>, (state: Partial<T>) => void] => {
	const initialEntry = navigation.currentEntry!;

	const id = initialEntry.id;
	const [state, setState] = createSignal(initialEntry.getState() ?? {});

	let own = false;

	const updateState = (state: Partial<T>) => {
		own = true;

		// @ts-expect-error
		setState(state);
		navigation.updateCurrentEntry({ state: state });

		own = false;
	};

	navigation.addEventListener('currententrychange', () => {
		const to = navigation.currentEntry!;

		if (to.id === id && !own) {
			setState(to.getState() ?? {});
		}
	});

	return [state, updateState];
};

export const getEntryAt = (delta: number) => {
	const currentEntry = navigation.currentEntry!;
	const entries = navigation.entries();

	return entries[currentEntry.index + delta];
};
