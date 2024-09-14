import { lazy } from 'solid-js';

import type { AppBskyEmbedImages } from '@atcute/client/lexicons';

import { openModal } from '~/com/globals/modals';

const ImageViewerDialog = lazy(() => import('~/com/components/dialogs/ImageViewerDialog'));

export interface ImageEmbedProps {
	/** Expected to be static */
	embed: AppBskyEmbedImages.View;
	blur?: boolean;
	/** Expected to be static */
	borderless?: boolean;
	/** Expected to be static */
	standalone?: boolean;
	/** Expected to be static */
	interactive?: boolean;
}

const enum RenderMode {
	MULTIPLE,
	MULTIPLE_SQUARE,
	STANDALONE,
	STANDALONE_RATIO,
}

const ImageEmbed = (props: ImageEmbedProps) => {
	const { embed, borderless, standalone, interactive } = props;

	const images = embed.images;
	const length = images.length;

	const hasStandaloneImage = standalone && length === 1 && images[0].aspectRatio !== undefined;

	const render = (index: number, mode: RenderMode) => {
		const { alt, thumb, aspectRatio } = images[index];

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
			<div class={`relative bg-background ` + cn} style={{ 'aspect-ratio': ratio }}>
				<img
					src={thumb}
					title={alt}
					class={
						`h-full w-full object-contain text-[0px]` +
						(interactive ? ` cursor-pointer` : ``) +
						// prettier-ignore
						(props.blur ? ` scale-125` + (!borderless ? ` blur` : ` blur-lg`) : ``)
					}
					onClick={() => {
						if (interactive) {
							openModal(() => <ImageViewerDialog active={index} images={images} />);
						}
					}}
				/>

				{/* @once */ mode === RenderMode.STANDALONE_RATIO && <div class="h-screen w-screen"></div>}

				{interactive && alt && (
					<div class="pointer-events-none absolute bottom-0 right-0 p-2">
						<div class="flex h-4 items-center rounded bg-p-neutral-950/60 px-1 text-[9px] font-bold tracking-wider text-white">
							ALT
						</div>
					</div>
				)}
			</div>
		);
	};

	return (
		<div
			class={
				`` +
				(!borderless ? ` overflow-hidden rounded-md border border-divider` : ``) +
				(hasStandaloneImage ? ` max-w-full self-start` : ``)
			}
		>
			{length === 4 ? (
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
			) : length === 3 ? (
				<div class="flex gap-0.5">
					<div class="flex aspect-square grow-2 basis-0 flex-col gap-0.5">
						{/* @once */ render(0, RenderMode.MULTIPLE)}
					</div>

					<div class="flex grow basis-0 flex-col gap-0.5">
						{/* @once */ render(1, RenderMode.MULTIPLE_SQUARE)}
						{/* @once */ render(2, RenderMode.MULTIPLE_SQUARE)}
					</div>
				</div>
			) : length === 2 ? (
				<div class="flex aspect-video gap-0.5">
					<div class="flex grow basis-0 flex-col gap-0.5">{/* @once */ render(0, RenderMode.MULTIPLE)}</div>
					<div class="flex grow basis-0 flex-col gap-0.5">{/* @once */ render(1, RenderMode.MULTIPLE)}</div>
				</div>
			) : hasStandaloneImage ? (
				<>{/* @once */ render(0, RenderMode.STANDALONE_RATIO)}</>
			) : length === 1 ? (
				<>{/* @once */ render(0, RenderMode.STANDALONE)}</>
			) : null}
		</div>
	);
};

export default ImageEmbed;
