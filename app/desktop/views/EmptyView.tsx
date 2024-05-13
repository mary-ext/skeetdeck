import { Match, Switch, lazy } from 'solid-js';

import { Navigate } from '@pkg/solid-page-router';

import { multiagent } from '~/api/globals/agent';

import { preferences } from '../globals/settings';
import { createStarterDeck } from '../lib/settings/onboarding';

import { Button } from '~/com/primitives/button';

const Onboarding = lazy(() => import('../components/views/Onboarding'));

const IndexPage = () => {
	return (
		<div class="relative grid grow place-items-center overflow-auto bg-background-dark">
			<Switch>
				<Match when={preferences.onboarding}>
					<Onboarding />
				</Match>

				<Match
					when={(() => {
						const decks = preferences.decks;
						return decks.length > 0 && decks[0];
					})()}
					keyed
				>
					{(deck) => <Navigate to={`/decks/${deck.id}`} />}
				</Match>

				<Match when={multiagent.active}>
					{(uid) => (
						<div class="flex max-w-md flex-col items-center gap-4 rounded-md bg-background p-6">
							<h1 class="text-base font-bold">Looking for a fresh start?</h1>

							<button
								onClick={() => {
									const deck = createStarterDeck(uid());
									preferences.decks.push(deck);
								}}
								class={/* @once */ Button({ variant: 'primary' })}
							>
								Create default deck
							</button>
						</div>
					)}
				</Match>

				<Match when>
					<div class="flex max-w-md flex-col items-center gap-4 rounded-md bg-background p-6">
						<p class="text-sm text-muted-fg">Nothing but crickets here...</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default IndexPage;
