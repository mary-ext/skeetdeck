import { For, Show, lazy } from 'solid-js';

import { offset } from '@floating-ui/dom';
import { A, Outlet, useNavigate, useParams } from '@solidjs/router';

import { multiagent } from '~/api/globals/agent.ts';
import { getCurrentTid } from '~/api/utils/tid.ts';

import { openModal } from '~/com/globals/modals.tsx';

import {
	type ProfilePaneConfig,
	type SearchPaneConfig,
	PANE_TYPE_SEARCH,
	PANE_TYPE_PROFILE,
	ProfilePaneTab,
} from '../globals/panes.ts';
import { addPane, preferences } from '../globals/settings.ts';

import { isUpdateReady, updateSW } from '~/utils/service-worker.ts';

import { Interactive } from '~/com/primitives/interactive.ts';

import { Flyout } from '~/com/components/Flyout.tsx';

import FeatherIcon from '~/com/icons/baseline-feather.tsx';
import SearchIcon from '~/com/icons/baseline-search.tsx';
import SettingsIcon from '~/com/icons/baseline-settings.tsx';
import SystemUpdateAltIcon from '~/com/icons/baseline-system-update-alt.tsx';
import TableLargeAddIcon from '~/com/icons/baseline-table-large-add.tsx';

import {
	SUGGESTION_PROFILE,
	SUGGESTION_SEARCH_POSTS,
	SearchFlyout,
} from '../components/flyouts/SearchFlyout.tsx';
import AddDeckDialog from '../components/settings/AddDeckDialog.tsx';

const SettingsDialog = lazy(() => import('../components/settings/SettingsDialog.tsx'));

const brandName = import.meta.env.VITE_BRAND_NAME;

const menuIconButton = Interactive({
	class: `grid h-11 shrink-0 place-items-center text-lg disabled:opacity-50`,
});

const updateButton = Interactive({
	class: `grid h-11 shrink-0 place-items-center text-lg text-green-600`,
});

const DashboardLayout = () => {
	const params = useParams();
	const navigate = useNavigate();

	return (
		<div class="flex h-screen w-screen overflow-hidden">
			<div class="flex w-14 shrink-0 flex-col border-r border-divider">
				<Show when={multiagent.active}>
					{(uid) => (
						<>
							<button disabled title="Post..." class={menuIconButton}>
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

												if (item.type === SUGGESTION_SEARCH_POSTS) {
													addPane<SearchPaneConfig>(deck, {
														type: PANE_TYPE_SEARCH,
														query: item.query,
														uid: $uid,
													});
												} else if (item.type === SUGGESTION_PROFILE) {
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

				{(() => {
					if (isUpdateReady()) {
						return (
							<button
								title={`${brandName} update is ready, click here to reload`}
								onClick={() => {
									updateSW();
								}}
								class={updateButton}
							>
								<SystemUpdateAltIcon />
							</button>
						);
					}
				})()}

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
