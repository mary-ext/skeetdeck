import { For, Show, Suspense, batch, lazy } from 'solid-js';

import { type RouteComponentProps, Navigate } from '@pkg/solid-page-router';
import { DragDropProvider, DragDropSensors, SortableProvider } from '@thisbeyond/solid-dnd';

import { openModal } from '~/com/globals/modals.tsx';
import { Title } from '~/com/lib/meta.tsx';

import { preferences } from '../globals/settings.ts';
import { ConstrainYDragAxis } from '../utils/dnd.ts';

import { PaneContextProvider } from '../components/panes/PaneContextProvider.tsx';
import PaneFallback from '../components/panes/PaneFallback.tsx';
import PaneRouter from '../components/panes/PaneRouter.tsx';

import AddIcon from '~/com/icons/baseline-add.tsx';
import EditIcon from '~/com/icons/baseline-edit.tsx';

import { Button } from '~/com/primitives/button.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';

const EditDeckDialog = lazy(() => import('../components/settings/EditDeckDialog.tsx'));
const AddPaneDialog = lazy(() => import('../components/settings/AddPaneDialog.tsx'));

const DecksView = (props: RouteComponentProps) => {
	const params = props.params as { deck: string };

	const deck = () => {
		const deckId = params.deck;
		const config = preferences.decks.find((d) => d.id === deckId);

		return config;
	};

	return (
		<Show when={deck()} keyed fallback={<Navigate to="/" />}>
			{(deck) => (
				<div class="flex grow gap-1 overflow-x-auto bg-background-dark px-1">
					<Title render={() => `Skeetdeck - ${deck.name}`} />
					<DragDropProvider
						onDragEnd={({ draggable, droppable }) => {
							if (draggable && droppable) {
								const panes = deck.panes;

								const fromIndex = panes.findIndex((pane) => pane.id === draggable.id);
								const toIndex = panes.findIndex((pane) => pane.id === droppable.id);

								if (fromIndex !== toIndex) {
									batch(() => {
										panes.splice(toIndex, 0, ...panes.splice(fromIndex, 1));
									});
								}
							}
						}}
					>
						<DragDropSensors />
						<ConstrainYDragAxis enabled />

						<SortableProvider ids={deck.panes.map((pane) => pane.id)}>
							<For each={deck.panes}>
								{(pane, idx) => (
									<PaneContextProvider
										deck={deck}
										pane={pane}
										index={idx}
										onDelete={() => {
											deck.panes.splice(idx(), 1);
										}}
									>
										<Suspense fallback={<PaneFallback />}>
											<PaneRouter pane={pane} />
										</Suspense>
									</PaneContextProvider>
								)}
							</For>
						</SortableProvider>
					</DragDropProvider>

					<div class="grid w-72 shrink-0 place-items-center">
						<div>
							<button
								onClick={() => {
									openModal(() => <AddPaneDialog deck={deck} />);
								}}
								class={/* @once */ Button({ variant: 'primary' })}
							>
								<AddIcon class="-ml-1.5 mr-2 text-lg" />
								<span>Add column</span>
							</button>
						</div>
					</div>

					<div class="-mr-1 ml-auto bg-background/20 p-2">
						<button
							onClick={() => {
								openModal(() => (
									<EditDeckDialog
										deck={deck}
										onRemove={() => {
											const index = preferences.decks.indexOf(deck);

											if (index !== -1) {
												preferences.decks.splice(index, 1);
											}
										}}
									/>
								));
							}}
							class={/* @once */ IconButton()}
						>
							<EditIcon />
						</button>
					</div>
				</div>
			)}
		</Show>
	);
};

export default DecksView;
