import type { ComponentProps, JSX } from 'solid-js';

import { clsx } from '~/utils/misc';

type ButtonProps = ComponentProps<'button'>;

export interface TabProps {
	active?: boolean;
	onClick?: ButtonProps['onClick'];
	children?: JSX.Element;
}

const Tab = (props: TabProps) => {
	return (
		<button
			onClick={props.onClick}
			class={clsx([
				`group flex h-full min-w-14 shrink-0 grow justify-center whitespace-nowrap px-4 text-sm font-bold text-muted-fg outline-2 -outline-offset-2 outline-primary hover:bg-secondary/30 focus-visible:outline`,
				props.active && `is-active text-primary`,
			])}
		>
			<div class="relative flex h-full w-max items-center">
				<span>{props.children}</span>
				<div class="absolute -inset-x-1 bottom-0 hidden h-1 rounded bg-accent group-[.is-active]:block" />
			</div>
		</button>
	);
};

export default Tab;
