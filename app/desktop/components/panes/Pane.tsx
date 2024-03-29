import { createEffect, type JSX } from 'solid-js';

import { multiagent } from '~/api/globals/agent';

import { getPaneSizeWidth } from '../../globals/panes';
import { resolvePaneSize } from '../../globals/settings';

import { IconButton } from '~/com/primitives/icon-button';

import DragIndicatorIcon from '~/com/icons/baseline-drag-indicator';

import { usePaneContext } from './PaneContext';
import { assert } from '~/utils/misc';

export interface PaneProps {
	title: string;
	subtitle?: string;
	actions?: JSX.Element;
	children?: JSX.Element;
}

const Pane = (props: PaneProps) => {
	const { pane } = usePaneContext();

	let containerRef: HTMLDivElement | undefined;
	let handleRef: HTMLButtonElement | undefined;

	const account = () => {
		const uid = pane.uid;
		const data = multiagent.accounts.find((acc) => acc.did === uid);

		if (data) {
			return '@' + data.session.handle;
		}

		return 'N/A';
	};

	createEffect(() => {
		assert(containerRef != null);
		assert(handleRef != null);
	});

	return (
		<div
			ref={containerRef}
			class="flex shrink-0 flex-col bg-background"
			style={{ width: getPaneSizeWidth(resolvePaneSize(pane.size)) + 'px' }}
		>
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					ref={handleRef}
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

				<div class="flex min-w-0 shrink-0 gap-1 empty:hidden">{props.actions}</div>
			</div>

			{props.children}
		</div>
	);
};

export default Pane;
