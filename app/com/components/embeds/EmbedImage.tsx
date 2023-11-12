import { Match, Switch } from 'solid-js';

import type { RefOf } from '~/api/atp-schema.ts';

type EmbeddedImage = RefOf<'app.bsky.embed.images#viewImage'>;

export interface EmbedImageProps {
	images: EmbeddedImage[];
	borderless?: boolean;
	blur?: boolean;
	interactive?: boolean;
}

const enum RenderMode {
	MULTIPLE,
	STANDALONE,
	STANDALONE_RATIO,
}

const EmbedImage = (props: EmbedImageProps) => {
	const images = () => props.images;

	const interactive = props.interactive;
	const borderless = props.borderless;
	const blur = () => props.blur;

	const hasStandaloneImage = (): boolean => {
		const $images = images();
		return interactive ? $images.length === 1 && !!$images[0].aspectRatio : false;
	};

	const render_ = (index: number, mode: RenderMode) => {
		const image = images()[index];

		const alt = image.alt;
		const aspectRatio = image.aspectRatio;

		// FIXME: with STANDALONE_RATIO, we are resizing the image to make it fit
		// the container with our given constraints, but this doesn't work when the
		// image hasn't had its metadata loaded yet, the browser will snap to the
		// smallest possible size for our layout.

		// clients will typically just shove the actual resolution info to the
		// `aspectRatio` field, but we can't rely on that as it could send
		// simplified ratios instead.

		// so what we'll do here is to just have an empty <div> sized to the device
		// screen width and height, and then remove it after the image has loaded.
		// there's theoretically no issue with keeping the <div> around though.

		let placeholder: HTMLDivElement | undefined;

		let cn: string | undefined;
		let ratio: string | undefined;

		if (mode === RenderMode.MULTIPLE) {
			cn = `relative min-h-0 grow basis-0`;
		} else if (mode === RenderMode.STANDALONE) {
			cn = `relative aspect-video`;
		} else if (mode === RenderMode.STANDALONE_RATIO) {
			cn = `min-h-16 min-w-16 relative max-h-80 max-w-full`;
			ratio = `${aspectRatio!.width}/${aspectRatio!.height}`;
		}

		return (
			<div class={cn} style={{ 'aspect-ratio': ratio }}>
				<img
					src={/* @once */ image.thumb}
					alt={alt}
					onClick={() => {
						if (interactive) {
							// openModal
						}
					}}
					onLoad={() => {
						if (placeholder) {
							placeholder.remove();
							placeholder = undefined;
						}
					}}
					class="h-full w-full object-cover text-[0px]"
					classList={{
						'cursor-pointer': interactive,
						'scale-110': blur(),
						blur: blur() && !borderless,
						'blur-lg': blur() && borderless,
					}}
				/>

				{mode === RenderMode.STANDALONE_RATIO && <div ref={placeholder} class="h-screen w-screen"></div>}

				{interactive && alt && (
					<button
						class="absolute bottom-0 left-0 m-2 h-5 rounded bg-black/70 px-1 text-xs font-medium"
						title="Show image description"
						onClick={() => {
							// openModal
						}}
					>
						ALT
					</button>
				)}
			</div>
		);
	};

	return (
		<div
			classList={{
				'overflow-hidden rounded-md border border-divider': !borderless,
				'max-w-full self-baseline': hasStandaloneImage(),
			}}
		>
			<Switch>
				<Match when={images().length >= 4}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{render_(0, RenderMode.MULTIPLE)}
							{render_(1, RenderMode.MULTIPLE)}
						</div>

						<div class="flex grow basis-0 flex-col gap-0.5">
							{render_(2, RenderMode.MULTIPLE)}
							{render_(3, RenderMode.MULTIPLE)}
						</div>
					</div>
				</Match>

				<Match when={images().length >= 3}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">
							{render_(0, RenderMode.MULTIPLE)}
							{render_(1, RenderMode.MULTIPLE)}
						</div>

						<div class="flex grow basis-0 flex-col gap-0.5">{render_(2, RenderMode.MULTIPLE)}</div>
					</div>
				</Match>

				<Match when={images().length >= 2}>
					<div class="flex aspect-video gap-0.5">
						<div class="flex grow basis-0 flex-col gap-0.5">{render_(0, RenderMode.MULTIPLE)}</div>
						<div class="flex grow basis-0 flex-col gap-0.5">{render_(1, RenderMode.MULTIPLE)}</div>
					</div>
				</Match>

				<Match when={hasStandaloneImage()}>{render_(0, RenderMode.STANDALONE_RATIO)}</Match>

				<Match when={images().length === 1}>{render_(0, RenderMode.STANDALONE)}</Match>
			</Switch>
		</div>
	);
};

export default EmbedImage;
