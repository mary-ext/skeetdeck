import { createRenderEffect } from 'solid-js';

import { multiagent } from '~/api/globals/agent';

const LoggedOutView = () => {
	let redirected = false;

	createRenderEffect(() => {
		if (multiagent.active) {
			redirected = true;
			navigation.navigate('/home', { history: 'replace' });
		}
	});

	if (redirected) {
		return null;
	}

	return (
		<div class="contents">
			<div class="grid grow place-items-center">
				<div class="flex flex-col items-center">
					<p class="text-4xl font-semibold">Langit</p>
					<p class="mt-2 text-muted-fg">Alternative Bluesky client</p>
				</div>
			</div>

			<div class="flex flex-col gap-4 px-4 pb-4 pt-6">
				<a
					href="sign_in"
					class="mt-6 rounded-md bg-accent px-4 py-3 text-center text-lg font-medium text-white hover:bg-accent-dark"
				>
					Sign in
				</a>
			</div>

			<div class="flex min-w-0 flex-wrap justify-center p-4 py-6">
				<span class="text-xs text-muted-fg">canary</span>
			</div>
		</div>
	);
};

export default LoggedOutView;
