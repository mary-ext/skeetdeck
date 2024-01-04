import Banner from '~/com/assets/banner.jpg?url';

const BRAND_NAME = import.meta.env.VITE_BRAND_NAME;
const BRAND_VERSION = import.meta.env.VITE_BRAND_VERSION;

const GIT_SOURCE = import.meta.env.VITE_GIT_SOURCE;
const GIT_COMMIT = import.meta.env.VITE_GIT_COMMIT;
const GIT_BRANCH = import.meta.env.VITE_GIT_BRANCH;

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
					GitHub repository
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
			</div>
		</div>
	);
};

export default AboutView;
