import { type JSX } from 'solid-js';

import { multiagent } from '~/api/globals/agent.ts';

import DragIndicatorIcon from '~/com/icons/baseline-drag-indicator.tsx';

import { IconButton } from '~/com/primitives/icon-button.ts';

import { usePaneContext } from './PaneContext.tsx';

export interface PaneHeaderProps {
	title: string;
	subtitle?: string;
	children?: JSX.Element;
}

const PaneHeader = (props: PaneHeaderProps) => {
	const { sortable, pane } = usePaneContext();

	const account = () => {
		const uid = pane.uid;
		const data = multiagent.accounts.find((acc) => acc.did === uid);

		if (data) {
			return '@' + (data.profile?.handle || data.session.handle);
		}

		return 'N/A';
	};

	return (
		<div
			class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4"
			classList={{ [`bg-secondary/30`]: sortable.isActiveDraggable }}
		>
			<button
				{...sortable.dragActivators}
				title="Click and drag to reorder this column"
				class={/* @once */ IconButton({ edge: 'left', color: 'muted', class: 'cursor-grab' })}
			>
				<DragIndicatorIcon />
			</button>

			<div class="flex min-w-0 grow flex-col gap-0.5">
				<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
					{pane.title || props.title}
				</p>
				<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
					{props.subtitle && (
						<span>
							<span>{props.subtitle}</span>
							<span class="px-1">•</span>
						</span>
					)}

					<span>{account()}</span>
				</p>
			</div>

			<div class="flex empty:hidden">{props.children}</div>
		</div>
	);
};

export default PaneHeader;
