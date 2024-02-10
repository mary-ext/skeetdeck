import { For, Show, Suspense, batch, lazy } from 'solid-js';

import { offset } from '@floating-ui/dom';
import { DragDropProvider, DragDropSensors, SortableProvider, createSortable } from '@thisbeyond/solid-dnd';

import { ShowFreeze } from '@pkg/solid-freeze';
import { type RouteComponentProps, location, navigate } from '@pkg/solid-page-router';

import { multiagent } from '~/api/globals/agent';
import { getCurrentTid } from '~/api/utils/tid';

import { openModal } from '~/com/globals/modals';
import { Title } from '~/com/lib/meta';

import {
	type ProfilePaneConfig,
	type SearchPaneConfig,
	PANE_TYPE_SEARCH,
	PANE_TYPE_PROFILE,
	ProfilePaneTab,
} from '../globals/panes';
import { addPane, preferences } from '../globals/settings';

import { updateSW, updateStatus } from '~/utils/service-worker';
import { clsx } from '~/utils/misc';

import { Interactive } from '~/com/primitives/interactive';

import CircularProgress from '~/com/components/CircularProgress';
import { Flyout } from '~/com/components/Flyout';
import Keyed from '~/com/components/Keyed';

import FeatherIcon from '~/com/icons/baseline-feather';
import SearchIcon from '~/com/icons/baseline-search';
import SettingsIcon from '~/com/icons/baseline-settings';
import SystemUpdateAltIcon from '~/com/icons/baseline-system-update-alt';
import TableLargeAddIcon from '~/com/icons/baseline-table-large-add';

import { useComposer } from '../components/composer/ComposerContext';
import { ConstrainXDragAxis } from '../utils/dnd';

const ComposerPane = lazy(() => import('../components/composer/ComposerPane.tsx'));

const AddDeckDialog = lazy(() => import('../components/settings/AddDeckDialog.tsx'));
const SettingsDialog = lazy(() => import('../components/settings/SettingsDialog.tsx'));

const SearchFlyout = lazy(() => import('../components/flyouts/SearchFlyout.tsx'));

const brandName = import.meta.env.VITE_BRAND_NAME;

const deckButton = Interactive({
	class: `group relative grid h-11 shrink-0 select-none place-items-center text-lg`,
});

const menuIconButton = Interactive({
	class: `grid h-11 shrink-0 place-items-center text-lg disabled:opacity-50`,
});

const updateButton = Interactive({
	variant: 'none',
	class: `relative grid h-11 shrink-0 place-items-center overflow-hidden text-lg`,
});

const DashboardLayout = (props: RouteComponentProps) => {
	const params = props.params as { deck: string | undefined };

	const composer = useComposer();
	const decks = preferences.decks;

	return (
		<div class="flex h-screen w-screen overflow-hidden">
			<Title render="Skeetdeck" />
			<div class="flex w-14 shrink-0 flex-col border-r border-divider">
				<Show when={multiagent.active}>
					{(uid) => (
						<>
							<button
								disabled={composer.open}
								title="Post..."
								onClick={() => {
									composer.open = true;
								}}
								class={menuIconButton}
							>
								<FeatherIcon />
							</button>

							<Flyout
								button={
									<button title="Search..." class={menuIconButton}>
										<SearchIcon />
									</button>
								}
								placement="bottom-start"
								middleware={[offset({ crossAxis: 8, mainAxis: -18 - 13 })]}
							>
								{({ close, menuProps }) => (
									<div {...menuProps}>
										<SearchFlyout
											uid={uid()}
											onAccept={(item) => {
												const $deck = params.deck;
												const $uid = uid();

												let deck = decks.find((deck) => deck.id === $deck);

												if (!deck) {
													decks.push({
														id: getCurrentTid(),
														name: 'New deck',
														emoji: '⭐',
														panes: [],
													});

													deck = decks.at(-1)!;
													navigate(`/decks/${deck.id}`);
												}

												if (item.type === 'search') {
													addPane<SearchPaneConfig>(deck, {
														type: PANE_TYPE_SEARCH,
														query: item.query,
														uid: $uid,
													});
												} else if (item.type === 'profile') {
													addPane<ProfilePaneConfig>(deck, {
														type: PANE_TYPE_PROFILE,
														profile: {
															did: item.profile.did,
															handle: item.profile.handle,
														},
														tab: ProfilePaneTab.POSTS,
														tabVisible: true,
														uid: $uid,
													});
												}

												close();
											}}
										/>
									</div>
								)}
							</Flyout>

							<hr class="border-divider" />
						</>
					)}
				</Show>

				<p class="py-3 text-center text-xs font-medium text-muted-fg">Decks</p>

				<div class="flex min-h-0 grow flex-col overflow-y-auto border-b border-divider scrollbar-hide">
					<button
						title="Add new deck"
						disabled={preferences.onboarding}
						onClick={() => {
							openModal(() => <AddDeckDialog />);
						}}
						class={menuIconButton}
					>
						<TableLargeAddIcon class="mx-auto" />
					</button>

					<DragDropProvider
						onDragEnd={({ draggable, droppable }) => {
							if (draggable && droppable) {
								const fromIndex = decks.findIndex((deck) => deck.id === draggable.id);
								const toIndex = decks.findIndex((deck) => deck.id === droppable.id);

								if (fromIndex !== toIndex) {
									batch(() => {
										decks.splice(toIndex, 0, ...decks.splice(fromIndex, 1));
									});
								}
							}
						}}
					>
						<DragDropSensors />
						<ConstrainXDragAxis enabled />

						<SortableProvider ids={decks.map((deck) => deck.id)}>
							<For each={preferences.decks}>
								{(deck) => {
									const id = deck.id;

									const sortable = createSortable(id);
									const href = `/decks/${id}`;

									return (
										<div ref={sortable} class={clsx([sortable.isActiveDraggable && `z-10 cursor-grabbing`])}>
											<a
												title={deck.name}
												href={href}
												class={deckButton}
												data-link="replace"
												draggable="false"
												inert={sortable.isActiveDraggable}
											>
												<div
													class={clsx([
														`pointer-events-none absolute inset-0 border-l-3 border-accent`,
														location.pathname !== href && `hidden`,
													])}
												></div>

												<span>{deck.emoji}</span>
											</a>
										</div>
									);
								}}
							</For>
						</SortableProvider>
					</DragDropProvider>
				</div>

				{updateStatus() !== 0 && (
					<button
						title={`${brandName} update is ready, click here to reload`}
						disabled={updateStatus() !== 2}
						onClick={() => {
							updateSW();
						}}
						class={
							updateButton +
							(updateStatus() === 2 ? ` bg-green-700 text-white hover:bg-green-900` : ` opacity-50`)
						}
					>
						<SystemUpdateAltIcon />
					</button>
				)}

				<button
					title="Open application settings"
					disabled={preferences.onboarding}
					onClick={() => {
						openModal(() => <SettingsDialog />);
					}}
					class={menuIconButton}
				>
					<SettingsIcon />
				</button>
			</div>

			<ShowFreeze when={composer.open}>
				<Suspense
					fallback={
						<div class="grid w-96 shrink-0 place-items-center border-r border-divider">
							<CircularProgress />
						</div>
					}
				>
					<Keyed key={composer.state}>
						<ComposerPane />
					</Keyed>
				</Suspense>
			</ShowFreeze>

			{/* <Suspense
				fallback={
					<div class="grid grow place-items-center">
						<CircularProgress />
					</div>
				}
			>
				<Outlet />
			</Suspense> */}

			{props.children}
		</div>
	);
};

export default DashboardLayout;
