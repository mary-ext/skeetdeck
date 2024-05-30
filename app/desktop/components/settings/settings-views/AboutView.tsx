import { registration } from '~/utils/service-worker';

import Banner from '~/com/assets/banner.jpg?url';

const BRAND_NAME = import.meta.env.VITE_BRAND_NAME;

const BRAND_VERSION = window.ENV.VERSION;
const GIT_SOURCE = window.ENV.GIT_SOURCE;
const GIT_COMMIT = window.ENV.GIT_COMMIT;
const GIT_BRANCH = window.ENV.GIT_BRANCH;

const AboutView = () => {
	return (
		<div class="flex flex-col">
			<img src={Banner} width={1080} height={360} class="w-full" />

			<div class="p-4">
				<h1 class="text-xl font-bold">{BRAND_NAME}</h1>
				<p class="text-de text-muted-fg">
					rev.{BRAND_VERSION} ({/* @once */ GIT_COMMIT ? `${GIT_BRANCH}/${GIT_COMMIT}` : `indev`})
				</p>

				<p class="mt-2 text-sm">
					An advanced web client for Bluesky with a deck interface, written in Solid.js.
				</p>

				<a target="_blank" href={GIT_SOURCE} class="mt-2 inline-block text-sm text-accent hover:underline">
					Source code
				</a>

				<p class="mt-2 text-de text-muted-fg">
					Photo by{' '}
					<a
						target="_blank"
						href="https://unsplash.com/@mr_williams_photography"
						class="text-accent hover:underline"
					>
						Micah Williams
					</a>{' '}
					on{' '}
					<a
						target="_blank"
						href="https://unsplash.com/photos/silhouette-of-birds-flying-under-cloudy-sky-qnesjQlrXU8"
						class="text-accent hover:underline"
					>
						Unsplash
					</a>
				</p>

				<p class="mt-2 text-de text-muted-fg">
					This web application comes with absolutely no warranty
					<br />
					Licensed under MIT License
				</p>

				<hr class="my-4 border-divider" />

				<div class="flex flex-wrap gap-4 text-de">
					<button
						title="Unregisters the service worker, this will reload the app."
						disabled={!registration()}
						onClick={() => {
							const $registration = registration();

							if ($registration) {
								$registration.unregister().finally(() => location.reload());
							}
						}}
						class="text-accent hover:underline disabled:pointer-events-none disabled:opacity-50"
					>
						Unregister service worker
					</button>
				</div>
			</div>
		</div>
	);
};

export default AboutView;
