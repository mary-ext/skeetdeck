import { type Accessor, type JSX, createSignal, createRenderEffect } from 'solid-js';

import { formatAbsDateTime, formatReltime } from '~/utils/intl/time';

export interface TimeAgoProps {
	value: string | number;
	children: (relative: Accessor<string>, absolute: Accessor<string>) => JSX.Element;
}

const getNow = Date.now;
const [tick, setTick] = createSignal(getNow(), { equals: false });

const tickForward = () => {
	setTick(getNow());
	setTimeout(() => requestIdleCallback(tickForward), 60_000);
};

tickForward();

const TimeAgo = (props: TimeAgoProps) => {
	const [absolute, setAbsolute] = createSignal('');
	const [relative, setRelative] = createSignal('');

	createRenderEffect(() => {
		const time = toInt(props.value);
		let first = true;

		setAbsolute(formatAbsDateTime(time));

		createRenderEffect(() => {
			const $tick = tick();
			const now = first ? getNow() : $tick;

			setRelative(formatReltime(time, now));
		});
	});

	return props.children(relative, absolute);
};

const toInt = (date: string | number): number => {
	return typeof date !== 'number' ? new Date(date).getTime() : date;
};

export default TimeAgo;
