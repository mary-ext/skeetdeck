import { For, Show } from 'solid-js';

import { offset } from '@floating-ui/dom';
import { A, Outlet, useNavigate, useParams } from '@solidjs/router';

import { multiagent } from '~/api/globals/agent.ts';
import { getCurrentTid } from '~/api/utils/tid.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { type ProfilePaneConfig, type SearchPaneConfig, PaneType, ProfilePaneTab } from '../globals/panes.ts';
import { addPane, preferences } from '../globals/settings.ts';

import { Interactive } from '~/com/primitives/interactive.ts';

import { Flyout } from '~/com/components/Flyout.tsx';

import FeatherIcon from '~/com/icons/baseline-feather.tsx';
import SearchIcon from '~/com/icons/baseline-search.tsx';
import SettingsIcon from '~/com/icons/baseline-settings.tsx';
import TableLargeAddIcon from '~/com/icons/baseline-table-large-add.tsx';

import { SearchFlyout, SuggestionType } from '../components/flyouts/SearchFlyout.tsx';
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
					{(uid) => (
						<>
							<button title="Post..." class={menuIconButton}>
								<FeatherIcon class="mx-auto" />
							</button>

							<Flyout
								button={
									<button title="Search..." class={menuIconButton}>
										<SearchIcon class="mx-auto" />
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

												if (item.type === SuggestionType.SEARCH_POSTS) {
													addPane<SearchPaneConfig>(deck, {
														type: PaneType.SEARCH,
														query: item.query,
														title: null,
														uid: $uid,
													});
												} else if (item.type === SuggestionType.PROFILE) {
													addPane<ProfilePaneConfig>(deck, {
														type: PaneType.PROFILE,
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
