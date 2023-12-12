import { type JSX, Suspense, createMemo, createResource } from 'solid-js';

export interface FreezeProps {
	freeze: boolean;
	children: JSX.Element;
	fallback?: JSX.Element;
}

type Deferred = Promise<undefined> & { r: (value: undefined) => void };

const identity = <T,>(value: T): T => value;

export const useSuspend = (freeze: () => boolean) => {
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
	// Hard-stuck to `true` if `props.when` is true
	const show = createMemo((prev: boolean) => {
		if (prev || props.when) {
			return true;
		}

		return prev;
	}, false);

	return Freeze({
		get freeze() {
			return show() && !props.when;
		},
		get children() {
			if (show()) {
				return props.children;
			}
		},
	});
};
