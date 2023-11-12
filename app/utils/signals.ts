import { type Accessor, type Setter, type SignalOptions, createSignal, untrack } from 'solid-js';

// Solid's createSignal is pretty clunky to carry around as it returns an array
// that is expected to be destructured, this Signal class serves as a wrapper.

export class Signal<T> {
	#get: Accessor<T>;
	#set: Setter<T>;

	constructor(value: T, options?: SignalOptions<T>) {
		const impl = createSignal(value, options);
		this.#get = impl[0];
		this.#set = impl[1];
	}

	get value() {
		return this.#get();
	}

	set value(next: T) {
		// @ts-expect-error
		this.#set(typeof next === 'function' ? () => next : next);
	}

	peek() {
		return untrack(this.#get);
	}
}

export interface ReadonlySignal<T> extends Signal<T> {
	readonly value: T;
}

export const signal = <T>(value: T, options?: SignalOptions<T>) => {
	return new Signal(value, options);
};
