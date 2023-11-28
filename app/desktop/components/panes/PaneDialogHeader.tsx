import type { JSX } from 'solid-js';

import { IconButton } from '~/com/primitives/icon-button.ts';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left.tsx';
import CloseIcon from '~/com/icons/baseline-close.tsx';

import { usePaneModalState } from './PaneContext.tsx';

export interface PaneDialogHeaderProps {
	title: string;
	subtitle?: string;
	disabled?: boolean;
	children?: JSX.Element;
}

const PaneDialogHeader = (props: PaneDialogHeaderProps) => {
	const modal = usePaneModalState();

	return (
		<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
			{(() => {
				if (modal.depth > 0) {
					return (
						<button
							title="Go back to previous dialog"
							onClick={modal.close}
							disabled={props.disabled}
							class={/* @once */ IconButton({ edge: 'left' })}
						>
							<ArrowLeftIcon />
						</button>
					);
				} else {
					return (
						<button
							title="Close dialog"
							onClick={modal.close}
							disabled={props.disabled}
							class={/* @once */ IconButton({ edge: 'left' })}
						>
							<CloseIcon />
						</button>
					);
				}
			})()}

			<div class="flex min-w-0 grow flex-col gap-0.5">
				<p class="overflow-hidden text-ellipsis whitespace-nowrap break-all text-base font-bold leading-5">
					{props.title}
				</p>

				{props.subtitle && (
					<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
						{props.subtitle}
					</p>
				)}
			</div>

			<fieldset disabled={props.disabled} class="flex empty:hidden">
				{props.children}
			</fieldset>
		</div>
	);
};

export default PaneDialogHeader;
