import { type SignalOptions, createSignal } from 'solid-js';

const isArray = Array.isArray;

export const noop = () => {};

export const isPlainObject = (value: any): value is Object => {
	if (typeof value !== 'object' || value === null) {
		return false;
	}

	const prototype = Object.getPrototypeOf(value);
	return prototype === null || prototype === Object.prototype;
};

const isPlainArray = (value: any) => {
	return isArray(value) && value.length === Object.keys(value).length;
};

export const replaceEqualDeep = (a: any, b: any): any => {
	if (a === b) {
		return a;
	}

	const array = isPlainArray(a) && isPlainArray(b);

	if (array || (isPlainObject(a) && isPlainObject(b))) {
		const aSize = array ? a.length : Object.keys(a).length;
		const bItems = array ? b : Object.keys(b);
		const bSize = bItems.length;
		const copy: any = array ? [] : {};

		let equalItems = 0;

		for (let i = 0; i < bSize; i++) {
			const key = array ? i : bItems[i];
			copy[key] = replaceEqualDeep(a[key], b[key]);

			if (copy[key] === a[key]) {
				equalItems++;
			}
		}

		return aSize === bSize && equalItems === aSize ? a : copy;
	}

	return b;
};

export interface Ref<T> {
	_value: T;
}

export const ref = <T>(value: T, options?: SignalOptions<T>): Ref<T> => {
	const [get, set] = createSignal(value, options);

	return {
		get _value() {
			return get();
		},
		set _value(next: T) {
			// @ts-expect-error
			set(typeof next === 'function' ? () => next : next);
		},
	};
};
