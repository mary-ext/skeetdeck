import { For, batch, createEffect, createSignal, onCleanup } from 'solid-js';

import {
	draggable,
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter';
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview';
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview';

import {
	type Edge,
	attachClosestEdge,
	extractClosestEdge,
} from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';

import { location } from '@pkg/solid-page-router';

import { Interactive } from '~/com/primitives/interactive';

import { type ItemPosition, getItemPosition } from '~/utils/dnd';
import { assert, clsx } from '~/utils/misc';

import type { DeckConfig } from '../../globals/panes';
import { Portal } from 'solid-js/web';

// I don't expect <DeckList> to be used more than once here, so it's fine to
// define the symbol outside like this.
const dndDeckId = Symbol();

interface DndDeckItem {
	[dndDeckId]: true;
	id: string;
	index: number;
}

const isDndDeckItem = (data: any): data is DndDeckItem => {
	return dndDeckId in data;
};

const DeckList = (props: { decks: DeckConfig[] }) => {
	createEffect(() => {
		const decks = props.decks;

		onCleanup(
			monitorForElements({
				canMonitor: ({ source }) => {
					return dndDeckId in source.data;
				},
				onDrop: ({ location, source }) => {
					const target = location.current.dropTargets[0];
					if (!target) {
						return;
					}

					const sourceData = source.data;
					const targetData = target.data;

					if (!isDndDeckItem(sourceData) || !isDndDeckItem(targetData)) {
						return;
					}

					const indexOfTarget = decks.findIndex((item) => item.id === targetData.id);
					if (indexOfTarget < 0) {
						return;
					}

					const startIndex = sourceData.index;
					const closestEdgeOfTarget = extractClosestEdge(targetData);

					const finishIndex = getReorderDestinationIndex({
						startIndex,
						closestEdgeOfTarget,
						indexOfTarget,
						axis: 'vertical',
					});

					if (finishIndex === startIndex) {
						// If there would be no change, we skip the update
						return;
					}

					batch(() => {
						decks.splice(finishIndex, 0, ...decks.splice(startIndex, 1));
					});
				},
			}),
		);
	});

	return (
		<For each={props.decks}>
			{(deck, index) => {
				return <DeckButton deck={deck} index={index} pos={getItemPosition(index(), props.decks)} />;
			}}
		</For>
	);
};

export default DeckList;

const enum DeckStateKind {
	IDLE,
	PREVIEW,
	DRAGGING,
}

type DeckState =
	| { k: DeckStateKind.IDLE }
	| { k: DeckStateKind.PREVIEW; c: HTMLElement }
	| { k: DeckStateKind.DRAGGING };

const idleState: DeckState = { k: DeckStateKind.IDLE };
const draggingState: DeckState = { k: DeckStateKind.DRAGGING };

const deckBtn = Interactive({
	class: `group relative grid h-11 shrink-0 select-none place-items-center text-lg`,
});

const DeckButton = (props: { deck: DeckConfig; index: () => number; pos: ItemPosition }) => {
	const deck = props.deck;
	const getIndex = props.index;

	const id = deck.id;
	const href = `/decks/${id}`;

	const [state, setState] = createSignal<DeckState>(idleState);
	const [closestEdge, setClosestEdge] = createSignal<Edge | null>(null);

	return (
		<div
			ref={(element) => {
				createEffect(() => {
					const index = getIndex();
					const data = { [dndDeckId]: true, id, index };

					onCleanup(
						draggable({
							element,
							getInitialData: () => data,
							onGenerateDragPreview: ({ nativeSetDragImage }) =>
								setCustomNativeDragPreview({
									nativeSetDragImage,
									getOffset: pointerOutsideOfPreview({ x: '12px', y: '8px' }),
									render: ({ container }) => {
										setState({ k: DeckStateKind.PREVIEW, c: container });
										return () => setState(draggingState);
									},
								}),
							onDragStart: () => setState(draggingState),
							onDrop: () => setState(idleState),
						}),
					);

					onCleanup(
						dropTargetForElements({
							element,
							canDrop: ({ source }) => {
								return dndDeckId in source.data;
							},
							getData: ({ input }) => {
								return attachClosestEdge(data, {
									element,
									input,
									allowedEdges: ['top', 'bottom'],
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
									(isItemBeforeSource && closestEdge === 'bottom') ||
									(isItemAfterSource && closestEdge === 'top');

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
			}}
			class={clsx([`z-10 cursor-grabbing`])}
		>
			<a title={deck.name} href={href} class={deckBtn} data-link="replace" draggable="false">
				<div
					class={clsx([
						`pointer-events-none absolute inset-0 border-l-3 border-accent`,
						location.pathname !== href && `hidden`,
					])}
				></div>

				<span>{deck.emoji}</span>

				{(() => {
					const $closestEdge = closestEdge();

					if ($closestEdge !== null) {
						const top = $closestEdge === 'top';

						return (
							<div class="absolute h-0.5 w-full bg-accent" style={`${top ? 'top' : 'bottom'}: -1px`}></div>
						);
					}
				})()}
			</a>

			{(() => {
				const $state = state();

				if ($state.k === DeckStateKind.PREVIEW) {
					return (
						<Portal mount={/* @once */ $state.c}>
							<div class="rounded border border-divider bg-background px-2 py-1 text-sm text-primary">
								<span class="mr-2">{deck.emoji}</span>
								<span>{deck.name}</span>
							</div>
						</Portal>
					);
				}
			})()}
		</div>
	);
};
