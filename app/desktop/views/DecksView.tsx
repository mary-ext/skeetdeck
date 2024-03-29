import { For, Show, Suspense, lazy } from 'solid-js';

import { type RouteComponentProps, Navigate } from '@pkg/solid-page-router';

import { openModal } from '~/com/globals/modals';
import { Title } from '~/com/lib/meta';

import { preferences } from '../globals/settings';

import { DeckContextProvider } from '../components/panes/DeckContextProvider';
import { PaneContextProvider } from '../components/panes/PaneContextProvider';
import PaneFallback from '../components/panes/PaneFallback';
import PaneRouter from '../components/panes/PaneRouter';

import AddIcon from '~/com/icons/baseline-add';
import EditIcon from '~/com/icons/baseline-edit';

import { Button } from '~/com/primitives/button';
import { IconButton } from '~/com/primitives/icon-button';

const EditDeckDialog = lazy(() => import('../components/settings/EditDeckDialog'));
const AddPaneDialog = lazy(() => import('../components/settings/AddPaneDialog'));

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

					<DeckContextProvider deck={deck}>
						<For each={deck.panes}>
							{(pane, idx) => (
								<PaneContextProvider
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
					</DeckContextProvider>

					<div class="grid w-72 shrink-0 place-items-center">
						<div>
							<button
								onClick={() => {
									openModal(() => <AddPaneDialog deck={deck} />);
								}}
								class={/* @once */ Button({ variant: 'primary' })}
							>
								<AddIcon class="-ml-1 mr-2 text-lg" />
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
