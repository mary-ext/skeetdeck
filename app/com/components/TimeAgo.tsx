import { createRenderEffect, createSignal, type Accessor, type JSX } from 'solid-js';

import { formatAbsDateTime, formatReltime } from '~/utils/intl/time';

export interface TimeAgoProps {
	value: string | number;
	children: (relative: Accessor<string>, absolute: Accessor<string>) => JSX.Element;
}

const [watch, tick] = createSignal<void>(undefined, { equals: false });

const tickForward = () => {
	tick();
	setTimeout(() => requestIdleCallback(tickForward), 60_000);
};

const TimeAgo = (props: TimeAgoProps) => {
	const [absolute, setAbsolute] = createSignal('');
	const [relative, setRelative] = createSignal('');

	createRenderEffect(() => {
		const time = toInt(props.value);

		setAbsolute(formatAbsDateTime(time));

		createRenderEffect(() => {
			watch();
			return setRelative(formatReltime(time));
		});
	});

	return props.children(relative, absolute);
};

const toInt = (date: string | number): number => {
	return typeof date !== 'number' ? new Date(date).getTime() : date;
};

export default TimeAgo;
tickForward();
