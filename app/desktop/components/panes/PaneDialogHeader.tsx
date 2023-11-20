import type { JSX } from 'solid-js';

import { IconButton } from '~/com/primitives/icon-button.ts';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';
import CloseIcon from '~/com/icons/baseline-close.tsx';

import { usePaneModalState } from './PaneContext.tsx';

export interface PaneDialogHeaderProps {
	title: string;
	subtitle?: string;
	children?: JSX.Element;
}

const PaneDialogHeader = (props: PaneDialogHeaderProps) => {
	const modal = usePaneModalState();

	return (
		<div class="flex h-13 shrink-0 items-center border-b border-divider px-4">
			{modal.depth > 0 && (
				<button
					title="Go back to previous dialog"
					onClick={modal.close}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>
			)}

			<div class="mx-2 flex min-w-0 grow flex-col gap-0.5">
				<p class="overflow-hidden text-ellipsis whitespace-nowrap break-all text-base font-bold leading-5">
					{props.title}
				</p>

				{props.subtitle && (
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
						{props.subtitle}
					</p>
				)}
			</div>

			{props.children}

			<button title="Close dialog" onClick={modal.reset} class={/* @once */ IconButton({ edge: 'right' })}>
				<CloseIcon />
			</button>
		</div>
	);
};

export default PaneDialogHeader;
