import {
	type Accessor,
	type Signal,
	createEffect,
	createMemo,
	createRenderEffect,
	createSignal,
	onCleanup,
} from 'solid-js';

export const EQUALS_FALSE = { equals: false } as const;

export const createDebouncedValue = <T>(
	accessor: Accessor<T>,
	delay: number,
	equals?: false | ((prev: T, next: T) => boolean),
): Accessor<T> => {
	const initial = accessor();
	const [state, setState] = createSignal(initial, { equals });

	createEffect((prev: T) => {
		const next = accessor();

		if (prev !== next) {
			const timeout = setTimeout(() => setState(() => next), delay);
			onCleanup(() => clearTimeout(timeout));
		}

		return next;
	}, initial);

	return state;
};

export const createDerivedSignal = <T>(accessor: Accessor<T>): Signal<T> => {
	const [state, setState] = createSignal<T>();

	createRenderEffect(() => {
		setState(accessor);
	});

	return [state, setState] as Signal<T>;
};

export interface LazyMemoFn {
	<T>(calc: (prev: T) => T, value: T): Accessor<T>;
	<T>(calc: (prev: T | undefined) => T, value?: undefined): Accessor<T>;
	<T>(calc: (prev: T | undefined) => T, value?: T): Accessor<T>;
}

export const createLazyMemo: LazyMemoFn = (calc, value) => {
	let reading = false;
	let stale = true;

	const [track, trigger] = createSignal(undefined, EQUALS_FALSE);

	// @ts-expect-error
	const memo = createMemo((p) => (reading ? calc(p) : ((stale = !track()), p)), value, EQUALS_FALSE);

	return () => {
		reading = true;
		if (stale) {
			trigger();
		}

		const value = memo();
		reading = false;

		return value;
	};
};
