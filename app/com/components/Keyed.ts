import { createMemo, untrack, type JSX } from 'solid-js';

export interface KeyedProps {
	key: unknown;
	children: JSX.Element;
}

const Keyed = (props: KeyedProps) => {
	const key = createMemo(() => props.key);

	return (() => {
		key();
		return untrack(() => props.children);
	}) as unknown as JSX.Element;
};

export default Keyed;
