import { Show, Suspense, createSignal, lazy } from 'solid-js';

import type { AppBskyEmbedDefs, AppBskyEmbedVideo } from '@atcute/client/lexicons';

import CircularProgress from '~/com/components/CircularProgress';

import PlayIcon from '~/com/icons/baseline-play';

export interface EmbedVideoProps {
	/** Expected to be static */
	embed: AppBskyEmbedVideo.View;
	blur?: boolean;
	/** Expected to be static */
	borderless?: boolean;
	/** Expected to be static */
	standalone?: boolean;
	/** Expected to be static */
	interactive?: boolean;
}

const VideoPlayer = lazy(() => import('./players/VideoPlayer'));

const EmbedVideo = (props: EmbedVideoProps) => {
	const { embed, borderless, standalone, interactive } = props;

	const [loaded, setLoaded] = createSignal(false);

	const isStandaloneVideo = standalone && embed.aspectRatio !== undefined;

	let ratio: string | undefined;
	let cn: string | undefined;

	if (isStandaloneVideo) {
		cn = `max-h-80 min-h-16 min-w-16 max-w-full overflow-hidden`;
		ratio = constructRatio(embed.aspectRatio!);
	} else {
		cn = `aspect-video overflow-hidden`;
	}

	return (
		<div
			class={
				`relative bg-background` +
				(!borderless ? ` overflow-hidden rounded-md border border-divider` : ``) +
				(isStandaloneVideo ? ` max-w-full self-start` : ``)
			}
		>
			<div class={cn} style={{ 'aspect-ratio': ratio }}>
				{!interactive ? (
					<img
						alt={/* @once */ embed.alt}
						src={/* @once */ embed.thumbnail}
						class="h-full w-full object-contain"
					/>
				) : (
					<Show
						when={loaded()}
						fallback={
							<button
								title="Play video"
								aria-description={/* @once */ embed.alt}
								onClick={() => setLoaded(true)}
								class="h-full w-full"
							>
								<img src={/* @once */ embed.thumbnail} class="h-full w-full object-contain" />

								<div class="absolute left-1/2 top-1/2 grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-gray-700/60 p-2 hover:bg-gray-700/80">
									<PlayIcon class="text-3xl" />
								</div>
							</button>
						}
					>
						<Suspense
							fallback={
								<div class="grid h-full w-full place-items-center">
									<CircularProgress />
								</div>
							}
						>
							<VideoPlayer embed={embed} />
						</Suspense>
					</Show>
				)}

				{/* Hack */}
				<div hidden={!standalone} class="h-screen w-screen"></div>
			</div>
		</div>
	);
};

export default EmbedVideo;

const constructRatio = (aspectRatio: AppBskyEmbedDefs.AspectRatio): string => {
	return `${aspectRatio.width}/${aspectRatio.height}`;
};
