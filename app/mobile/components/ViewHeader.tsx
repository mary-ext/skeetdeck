import type { JSX } from 'solid-js';

import { clsx } from '~/utils/misc.ts';

export interface ViewHeaderProps {
	title: string;
	subtitle?: string;
	fixed?: boolean;
	borderless?: boolean;
	children?: JSX.Element;
}

const ViewHeader = (props: ViewHeaderProps) => {
	return (
		<div
			class={clsx([
				'flex h-13 min-w-0 shrink-0 items-center gap-2 border-divider px-4',
				!props.fixed && `sticky top-0`,
				!props.borderless && `border-b`,
			])}
		>
			<div class="flex min-w-0 grow flex-col gap-0.5">
				<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
					{props.title}
				</p>

				{props.subtitle && (
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
						{props.subtitle}
					</p>
				)}
			</div>

			<fieldset class="flex min-w-0 empty:hidden">{props.children}</fieldset>
		</div>
	);
};

export default ViewHeader;
