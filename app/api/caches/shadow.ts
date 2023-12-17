import { type Signal, createRenderEffect, createSignal, batch } from 'solid-js';

declare const Shadow: unique symbol;
export type Shadow<T> = T & { [Shadow]: true };

const castShadow = <T>(value: T): Shadow<T> => {
	return value as unknown as Shadow<T>;
};

export const createShadow = <T extends WeakKey, S, P extends unknown[]>(
	mergeShadow: (item: T, shadow: Partial<S>) => T,
	getItems: (...params: P) => T[],
) => {
	const locals = new WeakMap<T, Signal<Partial<S> | undefined>>();

	return {
		_locals: locals,
		get(accessor: () => T) {
			const [shadowed, setShadowed] = createSignal<Shadow<T>>(undefined as any);

			createRenderEffect(() => {
				const item = accessor();

				let existing = locals.get(item);
				if (existing === undefined) {
					locals.set(item, (existing = createSignal()));
				}

				createRenderEffect(() => {
					const shadow = existing![0]();
					setShadowed(() => castShadow(shadow ? mergeShadow(item, shadow) : item));
				});
			});

			return shadowed;
		},
		update(args: P, partial: Partial<S>) {
			const items = getItems(...args);

			if (items.length === 0) {
				return;
			}

			batch(() => {
				const update = (prev: Partial<S> | undefined) => (prev ? { ...prev, ...partial } : partial);

				for (let i = 0, ilen = items.length; i < ilen; i++) {
					const item = items[i];

					let signal = locals.get(item);
					if (signal !== undefined) {
						signal[1](update);
					} else {
						// @ts-expect-error - no idea why it's throwing a fit here
						locals.set(item, createSignal(partial));
					}
				}
			});
		},
	};
};
