import { lazy } from 'solid-js';

import type { AppBskyEmbedImages } from '~/api/atp-schema';

import { clsx } from '~/utils/misc';

import { openModal } from '~/com/globals/modals';

import ImageAltAction from './images/ImageAltAction';

const LazyImageViewerDialog = lazy(() => import('../dialogs/ImageViewerDialog'));

type EmbeddedImage = AppBskyEmbedImages.ViewImage;

export interface EmbedImageProps {
	images: EmbeddedImage[];
	borderless?: boolean;
	blur?: boolean;
	interactive?: boolean;
}

const enum RenderMode {
	MULTIPLE,
	MULTIPLE_SQUARE,
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

	const render = (index: number, mode: RenderMode) => {
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
		// screen width and height. there's no issue with keeping the <div> around,
		// so we'll do just that.

		let cn: string | undefined;
		let ratio: string | undefined;

		if (mode === RenderMode.MULTIPLE) {
			cn = `min-h-0 grow basis-0 overflow-hidden`;
		} else if (mode === RenderMode.MULTIPLE_SQUARE) {
			cn = `aspect-square overflow-hidden`;
		} else if (mode === RenderMode.STANDALONE) {
			cn = `aspect-video overflow-hidden`;
		} else if (mode === RenderMode.STANDALONE_RATIO) {
			cn = `max-h-80 min-h-16 min-w-16 max-w-full overflow-hidden`;
			ratio = `${aspectRatio!.width}/${aspectRatio!.height}`;
		}

		return (
			<div class={`relative ` + cn} style={{ 'aspect-ratio': ratio }}>
				<img
					src={/* @once */ image.thumb}
					alt={alt}
					onClick={() => {
						if (interactive) {
							openModal(() => <LazyImageViewerDialog images={images()} active={index} />);
						}
					}}
					class={clsx([
						`h-full w-full object-cover text-[0px]`,
						interactive && `cursor-pointer`,
						blur() && `scale-110 ` + (!borderless ? `blur` : `blur-lg`),
					])}
				/>

				{mode === RenderMode.STANDALONE_RATIO && <div class="h-screen w-screen"></div>}

				{interactive && alt && (
					<ImageAltAction alt={alt}>
						<button
							class="absolute bottom-0 left-0 m-2 h-5 rounded bg-black/70 px-1 text-xs font-medium text-white"
							title="Show image description"
						>
							ALT
						</button>
					</ImageAltAction>
				)}
			</div>
		);
	};

	return (
		<div
			class={clsx([
				!borderless && `overflow-hidden rounded-md border border-divider`,
				hasStandaloneImage() && `max-w-full self-start`,
			])}
		>
			{(() => {
				const images = props.images;

				if (images.length >= 4) {
					return (
						<div class="flex gap-0.5">
							<div class="flex grow basis-0 flex-col gap-0.5">
								{/* @once */ render(0, RenderMode.MULTIPLE_SQUARE)}
								{/* @once */ render(2, RenderMode.MULTIPLE_SQUARE)}
							</div>

							<div class="flex grow basis-0 flex-col gap-0.5">
								{/* @once */ render(1, RenderMode.MULTIPLE_SQUARE)}
								{/* @once */ render(3, RenderMode.MULTIPLE_SQUARE)}
							</div>
						</div>
					);
				}

				if (images.length >= 3) {
					return (
						<div class="flex gap-0.5">
							<div class="flex aspect-square grow-2 basis-0 flex-col gap-0.5">
								{/* @once */ render(0, RenderMode.MULTIPLE)}
							</div>

							<div class="flex grow basis-0 flex-col gap-0.5">
								{/* @once */ render(1, RenderMode.MULTIPLE_SQUARE)}
								{/* @once */ render(2, RenderMode.MULTIPLE_SQUARE)}
							</div>
						</div>
					);
				}

				if (images.length >= 2) {
					return (
						<div class="flex aspect-video gap-0.5">
							<div class="flex grow basis-0 flex-col gap-0.5">
								{/* @once */ render(0, RenderMode.MULTIPLE)}
							</div>
							<div class="flex grow basis-0 flex-col gap-0.5">
								{/* @once */ render(1, RenderMode.MULTIPLE)}
							</div>
						</div>
					);
				}

				if (hasStandaloneImage()) {
					return render(0, RenderMode.STANDALONE_RATIO);
				}

				if (images.length === 1) {
					return render(0, RenderMode.STANDALONE);
				}
			})()}
		</div>
	);
};

export default EmbedImage;
