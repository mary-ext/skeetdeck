import { type Accessor, type JSX, createSignal, createRenderEffect } from 'solid-js';

import { formatAbsDateTime, formatReltime } from '~/utils/intl/time.ts';

export interface TimeAgoProps {
	value: string | number;
	children: (relative: Accessor<string>, absolute: Accessor<string>) => JSX.Element;
}

const [tick, setTick] = createSignal(undefined, { equals: false });

setInterval(() => {
	setTick(undefined);
}, 60_000);

const TimeAgo = (props: TimeAgoProps) => {
	const [absolute, setAbsolute] = createSignal('');
	const [relative, setRelative] = createSignal('');

	createRenderEffect(() => {
		const $value = props.value;

		setAbsolute(formatAbsDateTime($value));

		createRenderEffect(() => {
			tick();

			setRelative(formatReltime($value));
		});
	});

	return props.children(relative, absolute);
};

export default TimeAgo;
