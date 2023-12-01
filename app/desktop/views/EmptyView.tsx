import { Match, Switch, batch } from 'solid-js';

import { Navigate } from '@solidjs/router';

import type { DID } from '~/api/atp-schema.ts';
import { getAccountData, multiagent } from '~/api/globals/agent.ts';
import { getCurrentTid } from '~/api/utils/tid.ts';

import { FILTER_ALL } from '~/api/queries/get-notifications.ts';

import { PaneType, ProfilePaneTab, SpecificPaneSize } from '../globals/panes.ts';
import { preferences } from '../globals/settings.ts';

import { Button } from '~/com/primitives/button.ts';
import { openModal } from '~/com/globals/modals.tsx';

import AddAccountDialog from '../components/settings/AddAccountDialog.tsx';

const brandName = import.meta.env.VITE_APP_BRAND_NAME;

const createDefaultDeck = (uid: DID) => {
	const data = getAccountData(uid);

	if (!data) {
		return;
	}

	batch(() => {
		preferences.onboarding = false;

		preferences.decks.push({
			id: getCurrentTid(),
			name: 'Personal',
			emoji: '⭐',
			panes: [
				{
					type: PaneType.HOME,
					id: getCurrentTid(),
					uid: uid,
					size: SpecificPaneSize.INHERIT,
					title: null,
				},
				{
					type: PaneType.NOTIFICATIONS,
					id: getCurrentTid(),
					uid: uid,
					size: SpecificPaneSize.INHERIT,
					title: null,
					mask: FILTER_ALL,
				},
				{
					type: PaneType.PROFILE,
					id: getCurrentTid(),
					uid: uid,
					size: SpecificPaneSize.INHERIT,
					title: null,
					profile: {
						did: uid,
						handle: data.session.handle,
					},
					tab: ProfilePaneTab.POSTS,
					tabVisible: true,
				},
			],
		});
	});
};

const IndexPage = () => {
	return (
		<div class="grid grow">
			<div class="m-2 h-full max-h-96 w-full max-w-2xl place-self-center p-4">
				<h1 class="mb-4 text-2xl font-medium">{brandName}</h1>

				<Switch>
					<Match when={preferences.onboarding}>
						<div>
							<p class="mb-2">Welcome to {brandName}, an alternative web client for Bluesky!</p>

							<p>
								It looks like this is the first time you're here, so to get started, add your Bluesky account
								below and we'll set up an example deck for you.
							</p>

							<div class="mt-8 flex justify-center">
								<button
									onClick={() => {
										openModal(() => <AddAccountDialog />);
									}}
									class={/* @once */ Button({ variant: 'primary' })}
								>
									Add account
								</button>
							</div>
						</div>

						{(() => {
							const uid = multiagent.active;

							if (uid) {
								createDefaultDeck(uid);
							}

							return null;
						})()}
					</Match>

					<Match when={preferences.decks.length > 0}>
						<Navigate
							href={(() => {
								const deck = preferences.decks[0];
								return `/decks/${deck.id}`;
							})()}
						/>
					</Match>

					<Match when={multiagent.active}>
						{(uid) => (
							<div>
								<p>Looking for a fresh start?</p>

								<div class="mt-8 flex justify-center">
									<button
										onClick={() => {
											createDefaultDeck(uid());
										}}
										class={/* @once */ Button({ variant: 'primary' })}
									>
										Create default deck
									</button>
								</div>
							</div>
						)}
					</Match>

					<Match when>
						<div>
							<p>Nothing but crickets here...</p>
						</div>
					</Match>
				</Switch>
			</div>
		</div>
	);
};

export default IndexPage;
