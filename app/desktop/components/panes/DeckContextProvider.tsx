import { type JSX, onCleanup, onMount, batch } from 'solid-js';

import { monitorForElements } from '@atlaskit/pragmatic-drag-and-drop/element/adapter';

import { extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge';
import { getReorderDestinationIndex } from '@atlaskit/pragmatic-drag-and-drop-hitbox/util/get-reorder-destination-index';

import type { DeckConfig } from '../../globals/panes';

import { type DeckContextObject, DeckContext, isDndPaneItem } from './DeckContext';

export interface DeckContextProviderProps {
	/** Expected to be static */
	deck: DeckConfig;
	children: JSX.Element;
}

export const DeckContextProvider = (props: DeckContextProviderProps) => {
	const symbol = Symbol();

	const deck = props.deck;
	const panes = deck.panes;

	const deckContext: DeckContextObject = {
		sym: symbol,
		deck: deck,
	};

	onMount(() => {
		onCleanup(
			monitorForElements({
				canMonitor: ({ source }) => {
					return isDndPaneItem(source.data) && source.data.instance === symbol;
				},
				onDrop: ({ location, source }) => {
					const target = location.current.dropTargets[0];
					if (!target) {
						return;
					}

					const sourceData = source.data;
					const targetData = target.data;

					if (
						!isDndPaneItem(sourceData) ||
						sourceData.instance !== symbol ||
						!isDndPaneItem(targetData) ||
						targetData.instance !== symbol
					) {
						return;
					}

					const indexOfTarget = panes.findIndex((item) => item.id === targetData.pane);
					if (indexOfTarget < 0) {
						return;
					}

					const startIndex = sourceData.index;
					const closestEdgeOfTarget = extractClosestEdge(targetData);

					const finishIndex = getReorderDestinationIndex({
						startIndex,
						closestEdgeOfTarget,
						indexOfTarget,
						axis: 'horizontal',
					});

					if (finishIndex === startIndex) {
						// If there would be no change, we skip the update
						return;
					}

					batch(() => {
						panes.splice(finishIndex, 0, ...panes.splice(startIndex, 1));
					});
				},
			}),
		);
	});

	return <DeckContext.Provider value={deckContext}>{props.children}</DeckContext.Provider>;
};
