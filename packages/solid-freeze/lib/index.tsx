import { type JSX, Suspense, createMemo, createResource } from 'solid-js';

export interface FreezeProps {
	freeze: boolean;
	children: JSX.Element;
	fallback?: JSX.Element;
}

type Deferred = Promise<undefined> & { r: (value: undefined) => void };

const identity = <T,>(value: T): T => value;

export const Freeze = (props: FreezeProps) => {
	const promise = createMemo((prev: Deferred | undefined) => {
		if (props.freeze) {
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

	return (
		<Suspense
			fallback={props.fallback}
			// @ts-expect-error
			children={[suspend, props.children]}
		/>
	);
};

export interface ShowFreezeProps {
	when: boolean;
	children: JSX.Element;
	fallback?: JSX.Element;
}

export const ShowFreeze = (props: ShowFreezeProps) => {
	const promise = createMemo((prev: Deferred | undefined) => {
		if (props.when) {
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

	const show = createMemo((prev: boolean) => {
		if (prev || props.when) {
			return prev;
		}

		return prev;
	}, false);

	const [suspend] = createResource(promise, identity);

	return (
		<Suspense
			fallback={props.fallback}
			// @ts-expect-error
			children={[suspend, () => show() && props.children]}
		/>
	);
};
