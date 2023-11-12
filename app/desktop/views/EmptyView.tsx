import { Match, Switch } from 'solid-js';

import { preferences } from '~/desktop/globals/settings.ts';

import button from '~/com/primitives/button.ts';

const IndexPage = () => {
	return (
		<div class="grid grow">
			<div class="m-2 h-full max-h-96 w-full max-w-2xl place-self-center p-4">
				<h1 class="mb-4 text-2xl font-medium">PLACEHOLDER</h1>

				<Switch>
					<Match when={preferences.onboarding}>
						<div>
							<p class="mb-2">Welcome to PLACEHOLDER, an alternative web client for Bluesky!</p>

							<p>
								It looks like this is the first time you're here, so to get started, add your Bluesky account
								below and we'll set up an example deck for you.
							</p>

							<div class="mt-8 flex justify-center">
								<button class={/* @once */ button({ variant: 'primary' })}>Add account</button>
							</div>
						</div>

						{/* @todo: case for redirecting to a deck that's been set up */}

						{/* @todo: case for guiding users to creating a brand new default deck */}
					</Match>
				</Switch>
			</div>
		</div>
	);
};

export default IndexPage;
