import type { JSX } from 'solid-js';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import CloseIcon from '~/com/icons/baseline-close';
import { IconButton } from '~/com/primitives/icon-button';

import { usePaneModalState } from './PaneContext';

export interface PaneDialogHeaderProps {
	title: string;
	subtitle?: string;
	disabled?: boolean;
	children?: JSX.Element;
}

const PaneDialogHeader = (props: PaneDialogHeaderProps) => {
	const modal = usePaneModalState();

	return (
		<div class="flex h-13 min-w-0 shrink-0 items-center gap-2 border-b border-divider px-4">
			{(() => {
				if (modal.depth > 0) {
					return (
						<button
							type="button"
							title="Return to previous dialog"
							disabled={props.disabled}
							onClick={modal.close}
							class={/* @once */ IconButton({ edge: 'left' })}
						>
							<ArrowLeftIcon />
						</button>
					);
				} else {
					return (
						<button
							type="button"
							title="Close dialog"
							disabled={props.disabled}
							onClick={modal.close}
							class={/* @once */ IconButton({ edge: 'left' })}
						>
							<CloseIcon />
						</button>
					);
				}
			})()}

			<div class="flex min-w-0 grow flex-col gap-0.5">
				<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
					{props.title}
				</p>

				<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg empty:hidden">
					{props.subtitle}
				</p>
			</div>

			<fieldset disabled={props.disabled} class="flex min-w-0 shrink-0 gap-1 empty:hidden">
				{props.children}
			</fieldset>
		</div>
	);
};

export default PaneDialogHeader;
