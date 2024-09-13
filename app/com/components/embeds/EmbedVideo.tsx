import Hls from 'hls.js';

import type { AppBskyEmbedVideo } from '@atcute/client/lexicons';

export interface EmbedVideoProps {
	video: AppBskyEmbedVideo.View;
}

const EmbedVideo = (props: EmbedVideoProps) => {
	const hls = new Hls({
		capLevelToPlayerSize: true,
	});

	return (
		<div
			style={{
				'aspect-ratio': `${props.video.aspectRatio?.width ?? 1}/${props.video.aspectRatio?.height ?? 1}`,
			}}
			class="overflow-hidden rounded-md border border-divider object-contain"
		>
			<video
				class="h-full w-full"
				preload="none"
				controls
				loop
				poster={props.video.thumbnail}
				ref={(node) => {
					if (!Hls.isSupported()) throw new VideoUnsupportedError();

					hls.attachMedia(node);
					hls.loadSource(props.video.playlist);

					// initial value, later on it's managed by Controls
					hls.autoLevelCapping = 0;
				}}
			/>
		</div>
	);
};

export class VideoUnsupportedError extends Error {
	constructor() {
		super('HLS is not supported');
	}
}

export default EmbedVideo;
