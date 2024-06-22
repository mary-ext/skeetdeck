import { createRenderEffect, createSignal, type Accessor, type JSX } from 'solid-js';

import { formatAbsDateTime, formatReltime } from '~/utils/intl/time';
import { requestIdle } from '~/utils/misc';

export interface TimeAgoProps {
	value: string | number;
	/** Expected to be static */
	absolute?: (time: number) => string;
	/** Expected to be static */
	relative?: (time: number) => string;
	children: (relative: Accessor<string>, absolute: Accessor<string>) => JSX.Element;
}

const [watch, tick] = createSignal<void>(undefined, { equals: false });

const tickForward = () => {
	tick();
	setTimeout(() => requestIdle(tickForward), 60_000);
};

const TimeAgo = (props: TimeAgoProps) => {
	const formatAbsolute = props.absolute ?? formatAbsDateTime;
	const formatRelative = props.relative ?? formatReltime;

	const [absolute, setAbsolute] = createSignal('');
	const [relative, setRelative] = createSignal('');

	createRenderEffect(() => {
		const time = toInt(props.value);

		setAbsolute(formatAbsolute(time));

		createRenderEffect(() => {
			watch();
			return setRelative(formatRelative(time));
		});
	});

	return props.children(relative, absolute);
};

const toInt = (date: string | number): number => {
	return typeof date !== 'number' ? new Date(date).getTime() : date;
};

export default TimeAgo;
tickForward();
