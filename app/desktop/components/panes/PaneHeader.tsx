import { type JSX } from 'solid-js';

import { multiagent } from '~/api/globals/agent';

import { clsx } from '~/utils/misc';

import DragIndicatorIcon from '~/com/icons/baseline-drag-indicator';

import { IconButton } from '~/com/primitives/icon-button';

import { usePaneContext } from './PaneContext';

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
			return '@' + data.session.handle;
		}

		return 'N/A';
	};

	return (
		<div
			class={clsx([
				`flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4`,
				sortable.isActiveDraggable && `bg-secondary/30`,
			])}
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
					{(() => {
						const subtitle = props.subtitle;
						return (subtitle ? subtitle + ' • ' : '') + account();
					})()}
				</p>
			</div>

			<div class="flex min-w-0 shrink-0 gap-1 empty:hidden">{props.children}</div>
		</div>
	);
};

export default PaneHeader;
