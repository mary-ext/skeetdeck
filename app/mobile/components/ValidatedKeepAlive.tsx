import { type JSX, For, createMemo, Suspense } from 'solid-js';

import { useSuspend } from '@pkg/solid-freeze';

type ValidKey = string | number | null | undefined;

export interface KeepAliveProps<T extends ValidKey> {
	key: T;
	valid: T[];
	render: (id: T) => JSX.Element;
}

const ValidatedKeepAlive = <T extends ValidKey>(props: KeepAliveProps<T>) => {
	let _valid: T[];

	const render = props.render;

	const keys = createMemo<T[]>((prev) => {
		if (_valid !== (_valid = props.valid) && prev.length !== 0) {
			prev = prev.filter((v) => _valid.includes(v));
		}

		const key = props.key;
		if (!prev.includes(key) && _valid.includes(key)) {
			return [...prev, key];
		}

		return prev;
	}, []);

	return (
		<For each={keys()}>
			{(key) => {
				const frozen = useSuspend(() => key !== props.key);
				const result = render(key);

				// @ts-expect-error
				return <Suspense children={[frozen, result]} />;
			}}
		</For>
	);
};

export default ValidatedKeepAlive;
