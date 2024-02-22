import type { JSX } from 'solid-js';

import { clsx } from '~/utils/misc';

import { IconButton } from '~/com/primitives/icon-button';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';

import NavDrawerButton from './main/NavDrawerButton';

export interface ViewHeaderProps {
	title: string;
	subtitle?: string;
	main?: boolean;
	back?: string;
	fixed?: boolean;
	borderless?: boolean;
	children?: JSX.Element;
}

const ViewHeader = (props: ViewHeaderProps) => {
	const main = props.main;
	const back = props.back;

	return (
		<div
			class={clsx([
				'flex h-13 min-w-0 shrink-0 items-center gap-2 border-b bg-background px-4',
				!props.fixed && `sticky top-0 z-30`,
				!props.borderless ? `border-divider` : `border-transparent`,
			])}
		>
			{main ? (
				<NavDrawerButton />
			) : back ? (
				<button
					title="Go back to previous page"
					onClick={() => {
						if (navigation.canGoBack) {
							navigation.back();
						} else {
							navigation.navigate(back, { history: 'replace' });
						}
					}}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>
			) : null}

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

			<fieldset class="flex min-w-0 gap-2 empty:hidden">{props.children}</fieldset>
		</div>
	);
};

export default ViewHeader;
