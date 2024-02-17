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

const TimeAgo = (props: TimeAgoProps) => {
	const [absolute, setAbsolute] = createSignal('');
	const [relative, setRelative] = createSignal('');

	createRenderEffect(() => {
		const time = toInt(props.value);

		setAbsolute(formatAbsDateTime(time));

		createRenderEffect((first: boolean) => {
			const $tick = tick();
			setRelative(formatReltime(time, first ? getNow() : $tick));

			return false;
		}, true);
	});

	return props.children(relative, absolute);
};

const toInt = (date: string | number): number => {
	return typeof date !== 'number' ? new Date(date).getTime() : date;
};

export default TimeAgo;
tickForward();
