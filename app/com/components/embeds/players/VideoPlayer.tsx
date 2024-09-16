import Hls from 'hls.js';
import { nanoid } from 'nanoid/non-secure';
import { onCleanup } from 'solid-js';

import type { AppBskyEmbedVideo } from '@atcute/client/lexicons';
import { EventEmitter } from '@mary/events';

const playerEvents = new EventEmitter<{
	playing(id: string): void;
}>();

export interface VideoPlayerProps {
	/** Expected to be static */
	embed: AppBskyEmbedVideo.View;
}

const VideoPlayer = ({ embed }: VideoPlayerProps) => {
	const playerId = nanoid();

	const hls = new Hls({
		capLevelToPlayerSize: true,
		xhrSetup(xhr, urlString) {
			const url = new URL(urlString);

			// Just in case it fails, we'll remove `session_id` everywhere
			url.searchParams.delete('session_id');

			xhr.open('get', url.toString());
		},
	});

	onCleanup(() => hls.destroy());

	// Redirect .{m3u8,ts} files directly to the CDN, skipping the watch time/retention tracking
	//
	// Worth noting, I don't think `session_id` is tied to your account in any way, this is
	// mostly an effort to get videos to load faster since this player is lazily-loaded
	hls.loadSource(embed.playlist.replace('https://video.bsky.app/watch/', 'https://video.cdn.bsky.app/hls/'));

	return (
		<div class="contents">
			<video
				ref={(node) => {
					hls.attachMedia(node);
					node.volume = 0.25;

					onCleanup(
						playerEvents.on('playing', (id) => {
							if (id !== playerId && !node.paused) {
								node.pause();
							}
						}),
					);
				}}
				aria-description={/* @once */ embed.alt}
				poster={/* @once */ embed.thumbnail}
				controls
				playsinline
				autoplay
				onPlay={() => playerEvents.emit('playing', playerId)}
				class="h-full w-full"
			/>
		</div>
	);
};

export default VideoPlayer;
