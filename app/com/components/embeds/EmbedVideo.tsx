import Hls from 'hls.js';

// TODO: Swap this out for the type from bsky-client
type EmbeddedVideo = {
	aspectRatio: {
		width: number;
		height: number;
	};
	playlist: string;
	thumbnail: string;
};

export interface EmbedVideoProps {
	video: EmbeddedVideo;
}

const EmbedVideo = (props: EmbedVideoProps) => {
	const hls = new Hls({
		capLevelToPlayerSize: true,
	});

	return (
		<div
			style={{
				'aspect-ratio': `${props.video.aspectRatio.width}/${props.video.aspectRatio.height}`,
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
