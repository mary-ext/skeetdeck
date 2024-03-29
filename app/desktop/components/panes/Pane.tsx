import { type JSX, createEffect, createSignal, onCleanup } from 'solid-js';

import { draggable, dropTargetForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import {
	type Edge,
	attachClosestEdge,
	extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';

import { multiagent } from '~/api/globals/agent';

import { getPaneSizeWidth } from '../../globals/panes';
import { resolvePaneSize } from '../../globals/settings';

import { IconButton } from '~/com/primitives/icon-button';

import DragIndicatorIcon from '~/com/icons/baseline-drag-indicator';

import { type DndPaneItem, dndPaneId, isDndPaneItem, useDeckContext } from './DeckContext';
import { usePaneContext } from './PaneContext';
import { assert } from '~/utils/misc';

export interface PaneProps {
	title: string;
	subtitle?: string;
	actions?: JSX.Element;
	children?: JSX.Element;
}

const Pane = (props: PaneProps) => {
	const { deck, sym } = useDeckContext();
	const { pane, index: getIndex } = usePaneContext();

	const [isDragging, setIsDragging] = createSignal(false);
	const [closestEdge, setClosestEdge] = createSignal<Edge | null>(null);

	let element: HTMLDivElement | undefined;
	let dragHandle: HTMLButtonElement | undefined;

	const account = () => {
		const uid = pane.uid;
		const data = multiagent.accounts.find((acc) => acc.did === uid);

		if (data) {
			return '@' + data.session.handle;
		}

		return 'N/A';
	};

	createEffect(() => {
		assert(element != null);
		assert(dragHandle != null);

		const index = getIndex();
		const data: DndPaneItem = {
			[dndPaneId]: true,
			instance: sym,
			deck: deck.id,
			pane: pane.id,
			index: index,
		};

		onCleanup(
			draggable({
				element,
				dragHandle,
				getInitialData: () => data as any,
				onDragStart: () => setIsDragging(true),
				onDrop: () => setIsDragging(false),
			}),
		);

		onCleanup(
			dropTargetForElements({
				element,
				canDrop: ({ source }) => {
					return isDndPaneItem(source.data) && source.data.instance === sym;
				},
				getData: ({ input }) => {
					return attachClosestEdge(data as any, {
						element,
						input,
						allowedEdges: ['left', 'right'],
					});
				},
				onDrag: ({ self, source }) => {
					if (source.element === element) {
						setClosestEdge(null);
						return;
					}

					const closestEdge = extractClosestEdge(self.data);
					const sourceIndex = source.data.index;

					assert(typeof sourceIndex === 'number');

					const isItemBeforeSource = index === sourceIndex - 1;
					const isItemAfterSource = index === sourceIndex + 1;

					const isDropIndicatorHidden =
						(isItemBeforeSource && closestEdge === 'bottom') || (isItemAfterSource && closestEdge === 'top');

					if (isDropIndicatorHidden) {
						setClosestEdge(null);
						return;
					}

					setClosestEdge(closestEdge);
				},
				onDragLeave: () => setClosestEdge(null),
				onDrop: () => setClosestEdge(null),
			}),
		);
	});

	return (
		<div
			ref={element}
			class="relative flex shrink-0 flex-col bg-background"
			style={{ width: getPaneSizeWidth(resolvePaneSize(pane.size)) + 'px' }}
		>
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
				<button
					ref={dragHandle}
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

			{(() => {
				if (isDragging()) {
					return <div class="absolute inset-0 bg-background-dark opacity-50"></div>;
				}
			})()}

			{(() => {
				const $closestEdge = closestEdge();
				if ($closestEdge !== null) {
					const left = $closestEdge === 'left';

					return (
						<div class="absolute h-full w-0.5 bg-accent" style={`${left ? 'left' : 'right'}: -3px`}></div>
					);
				}
			})()}
		</div>
	);
};

export default Pane;
