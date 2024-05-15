import { For, Suspense, createMemo, createResource, type JSX, type Resource } from 'solid-js';

export interface FreezeProps {
	freeze: boolean;
	children: JSX.Element;
	fallback?: JSX.Element;
}

type Deferred = Promise<undefined> & { r: (value: undefined) => void };

const identity = <T,>(value: T): T => value;

export const useSuspend = (freeze: () => boolean): Resource<void> => {
	const promise = createMemo((prev: Deferred | undefined) => {
		if (freeze()) {
			if (prev) {
				return prev;
			}

			let _resolve: Deferred['r'];
			let promise = new Promise((resolve) => (_resolve = resolve)) as Deferred;

			promise.r = _resolve!;
			return promise;
		} else if (prev) {
			prev.r(undefined);
		}
	});

	const [suspend] = createResource(promise, identity);

	return suspend;
};

export const Freeze = (props: FreezeProps) => {
	const suspend = useSuspend(() => props.freeze);

	return Suspense({
		get fallback() {
			return props.fallback;
		},
		// @ts-expect-error
		get children() {
			return [suspend, props.children];
		},
	});
};

export interface ShowFreezeProps {
	when: boolean;
	children: JSX.Element;
	fallback?: JSX.Element;
}

export const ShowFreeze = (props: ShowFreezeProps) => {
	// Hard-stuck to `true` if `props.when` is true
	const show = createMemo((prev: boolean) => {
		if (prev || props.when) {
			return true;
		}

		return prev;
	}, false);

	return Freeze({
		get freeze() {
			return !props.when;
		},
		get children() {
			if (show()) {
				return props.children;
			}
		},
	});
};

export interface KeepAliveProps<T> {
	value: T | undefined;
	include?: T[];
	render: (value: T) => JSX.Element;
}

export const KeepAlive = <T,>(props: KeepAliveProps<T>) => {
	const values = createMemo<T[]>((arr) => {
		const value = props.value;
		const include = props.include;

		if (value !== undefined && !arr.includes(value)) {
			arr = [...arr, value];
		}

		if (include !== undefined) {
			arr = arr.filter((x) => include.includes(x));
		}

		return arr;
	}, []);

	return For({
		get each() {
			return values();
		},
		children(value) {
			const suspend = useSuspend(() => value !== props.value);

			return Suspense({
				get children() {
					return [suspend as unknown as JSX.Element, props.render(value)];
				},
			});
		},
	});
};
