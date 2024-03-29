import { For, batch, createEffect, createMemo, createSignal, onCleanup } from 'solid-js';
import { Portal } from 'solid-js/web';

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

import { clsx } from '~/utils/misc';

import type { DeckConfig } from '../../globals/panes';

import { isDndPaneItem } from '../panes/DeckContext';

// I don't expect <DeckList> to be used more than once here, so there's just
// this one symbol being used.
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
					return isDndDeckItem(source.data);
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

		onCleanup(
			monitorForElements({
				canMonitor: ({ source }) => {
					return isDndPaneItem(source.data);
				},
				onDrop: ({ location, source }) => {
					const target = location.current.dropTargets[0];
					if (!target) {
						return;
					}

					const sourceData = source.data;
					const targetData = target.data;

					if (!isDndPaneItem(sourceData) || !isDndDeckItem(targetData) || sourceData.deck === targetData.id) {
						return;
					}

					const fromDeck = decks.find((deck) => deck.id === sourceData.deck);
					const toDeck = decks.find((deck) => deck.id === targetData.id);

					const index = sourceData.index;
					const paneConfig = fromDeck?.panes[index];

					if (!fromDeck || !toDeck || paneConfig?.id !== sourceData.pane) {
						return;
					}

					batch(() => {
						fromDeck.panes.splice(index, 1);
						toDeck.panes.push(paneConfig);
					});
				},
			}),
		);
	});

	return (
		<For each={props.decks}>
			{(deck, index) => {
				return <DeckButton deck={deck} index={index} />;
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

const DeckButton = (props: { deck: DeckConfig; index: () => number }) => {
	const deck = props.deck;
	const getIndex = props.index;

	const id = deck.id;
	const href = `/decks/${id}`;

	const [state, setState] = createSignal<DeckState>(idleState);
	const [dndEdge, setDndEdge] = createSignal<Edge | null>(null);

	const [paneDropping, setPaneDropping] = createSignal(false);

	const isDragging = createMemo(() => {
		return state().k === DeckStateKind.DRAGGING;
	});

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
								const data = source.data;
								return isDndDeckItem(data) || (isDndPaneItem(data) && data.deck !== id);
							},
							getData: ({ input }) => {
								return attachClosestEdge(data, {
									element,
									input,
									allowedEdges: ['top', 'bottom'],
								});
							},
							onDrag: ({ self, source }) => {
								const data = source.data;

								if (isDndDeckItem(data)) {
									if (source.element === element) {
										setDndEdge(null);
										return;
									}

									const closestEdge = extractClosestEdge(self.data);
									const sourceIndex = data.index;

									const isItemBeforeSource = index === sourceIndex - 1;
									const isItemAfterSource = index === sourceIndex + 1;

									const isDropIndicatorHidden =
										(isItemBeforeSource && closestEdge === 'bottom') ||
										(isItemAfterSource && closestEdge === 'top');

									if (isDropIndicatorHidden) {
										setDndEdge(null);
										return;
									}

									setDndEdge(closestEdge);
								} else if (isDndPaneItem(data)) {
									setPaneDropping(true);
								}
							},
							onDragLeave: () => {
								setDndEdge(null);
								setPaneDropping(false);
							},
							onDrop: () => {
								setDndEdge(null);
								setPaneDropping(false);
							},
						}),
					);
				});
			}}
			class="relative"
		>
			<a
				title={deck.name}
				href={href}
				class={clsx([deckBtn, isDragging() && `pointer-events-none opacity-50`])}
				data-link="replace"
				draggable="false"
			>
				<div
					class={clsx([
						`pointer-events-none absolute inset-0 border-l-3 border-accent`,
						location.pathname !== href && `hidden`,
					])}
				></div>

				<span>{deck.emoji}</span>
			</a>

			{(() => {
				const $closestEdge = dndEdge();

				if ($closestEdge !== null) {
					const top = $closestEdge === 'top';

					return (
						<div class="absolute h-0.5 w-full bg-accent" style={`${top ? 'top' : 'bottom'}: -1px`}></div>
					);
				}
			})()}

			{(() => {
				if (paneDropping()) {
					return (
						<div class="pointer-events-none absolute inset-0 border-2 border-dashed border-muted-fg"></div>
					);
				}
			})()}

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
