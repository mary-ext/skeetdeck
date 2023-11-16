import { For, Show } from 'solid-js';

import { offset } from '@floating-ui/dom';
import { A, Outlet, useNavigate, useParams } from '@solidjs/router';

import { multiagent } from '~/api/globals/agent.ts';
import { getCurrentTid } from '~/api/utils/tid.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { type SearchPaneConfig, PaneType } from '../globals/panes.ts';
import { addPane, preferences } from '../globals/settings.ts';

import { Interactive } from '~/com/primitives/interactive.ts';

import { Menu } from '~/com/components/Menu.tsx';
import SearchInput from '~/com/components/inputs/SearchInput.tsx';

import FeatherIcon from '~/com/icons/baseline-feather.tsx';
import SearchIcon from '~/com/icons/baseline-search.tsx';
import SettingsIcon from '~/com/icons/baseline-settings.tsx';
import TableLargeAddIcon from '~/com/icons/baseline-table-large-add.tsx';

import SettingsDialog from '../components/settings/SettingsDialog.tsx';
import AddDeckDialog from '../components/settings/AddDeckDialog.tsx';

const menuIconButton = Interactive({ class: `h-11 shrink-0 text-lg` });

const DashboardLayout = () => {
	const params = useParams();
	const navigate = useNavigate();

	return (
		<div class="flex h-screen w-screen overflow-hidden">
			<div class="flex w-14 shrink-0 flex-col border-r border-divider">
				<Show when={multiagent.active}>
					<button title="Post..." class={menuIconButton}>
						<FeatherIcon class="mx-auto" />
					</button>

					<Menu
						button={
							<button title="Search..." class={menuIconButton}>
								<SearchIcon class="mx-auto" />
							</button>
						}
						placement="bottom-start"
						middleware={[offset({ crossAxis: 8, mainAxis: -18 - 13 })]}
					>
						{({ close, menuProps }) => (
							<div {...menuProps} class="shadow-menu w-96 rounded-lg bg-background">
								<div class="p-4">
									<SearchInput
										onKeyDown={(ev) => {
											if (ev.key === 'Enter') {
												const $deck = params.deck;
												const $uid = multiagent.active!;

												const value = ev.currentTarget.value.trim();

												let deck = preferences.decks.find((deck) => deck.id === $deck);

												if (!deck) {
													preferences.decks.push({
														id: getCurrentTid(),
														name: 'New deck',
														emoji: '⭐',
														panes: [],
													});

													deck = preferences.decks.at(-1)!;
													navigate(`/decks/${deck.id}`);
												}

												if (value) {
													close();

													addPane<SearchPaneConfig>(deck, {
														type: PaneType.SEARCH,
														query: value,
														title: null,
														uid: $uid,
													});
												}
											}
										}}
									/>
								</div>

								<p class="p-4 pt-0 text-sm text-muted-fg">Start searching...</p>
							</div>
						)}
					</Menu>

					<hr class="border-divider" />
				</Show>

				<p class="py-3 text-center text-xs font-medium text-muted-fg">Decks</p>

				<div class="flex min-h-0 grow flex-col overflow-y-auto border-b border-divider scrollbar-hide">
					<button
						title="Add new deck"
						onClick={() => {
							openModal(() => <AddDeckDialog />);
						}}
						class={menuIconButton}
					>
						<TableLargeAddIcon class="mx-auto" />
					</button>

					<For each={preferences.decks}>
						{(deck) => (
							<A
								title={deck.name}
								href={/* @once */ `/decks/${deck.id}`}
								replace
								class={
									/* @once */ Interactive({
										class: 'group relative grid h-11 shrink-0 place-items-center text-lg',
									})
								}
								activeClass="is-active"
							>
								<div class="pointer-events-none absolute inset-0 hidden border-l-3 border-accent group-[.is-active]:block"></div>
								<span>{deck.emoji}</span>
							</A>
						)}
					</For>
				</div>

				<button
					title="Open application settings"
					onClick={() => {
						openModal(() => <SettingsDialog />);
					}}
					class={menuIconButton}
				>
					<SettingsIcon class="mx-auto" />
				</button>
			</div>

			{/* <Suspense
				fallback={
					<div class="grid grow place-items-center">
						<CircularProgress />
					</div>
				}
			>
				<Outlet />
			</Suspense> */}

			<Outlet />
		</div>
	);
};

export default DashboardLayout;
