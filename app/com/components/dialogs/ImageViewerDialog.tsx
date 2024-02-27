import { createEffect, createMemo, createSignal, onMount } from 'solid-js';

import { clsx } from '~/utils/misc';

import { closeModal } from '../../globals/modals';

import { Interactive } from '../../primitives/interactive';

import ArrowLeftIcon from '../../icons/baseline-arrow-left';
import CloseIcon from '../../icons/baseline-close';
import VisibilityIcon from '../../icons/baseline-visibility';
import VisibilityOffIcon from '../../icons/baseline-visibility-off';

const iconButton = Interactive({
	class: `pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-black/50 text-base text-white backdrop-blur`,
});

const altButton = Interactive({
	class: `group pointer-events-auto flex h-8 place-items-center rounded-full bg-black/50 px-2 text-base text-white backdrop-blur`,
});

export interface EmbeddedImage {
	fullsize: string;
	alt?: string;
}

export interface ImageViewerDialogProps {
	active?: number;
	images: EmbeddedImage[];
}

const ImageViewerDialog = (props: ImageViewerDialogProps) => {
	const images = props.images;
	const initialActive = props.active ?? 0;

	const [active, setActive] = createSignal(initialActive);
	const [displayAlt, setDisplayAlt] = createSignal(true);

	const [loading, setLoading] = createSignal(images.length);

	const hasNext = createMemo(() => active() < images.length - 1);
	const hasPrev = createMemo(() => active() > 0);

	const scrollRef = (node: HTMLElement) => {
		createEffect((first) => {
			const children = [...node.childNodes];
			const child = children[active()] as HTMLElement;

			child.scrollIntoView({ inline: 'center', behavior: first ? 'instant' : 'smooth' });

			console.log('foo');
			return false;
		}, true);
	};

	const bindImageWrapperRef = (index: number) => {
		return (node: HTMLElement) => {
			onMount(() => {
				const observer = new IntersectionObserver(
					(entries) => {
						const entry = entries[0];

						if (entry.isIntersecting) {
							setActive(index);
						}
					},
					{ threshold: 0.5 },
				);

				observer.observe(node);
			});
		};
	};

	const handleImageWrapperClick = (ev: MouseEvent) => {
		if (ev.currentTarget === ev.target) {
			closeModal();
		}
	};

	return (
		<div class="h-full w-full overflow-hidden bg-black/75">
			{loading() > 0 && (
				<div class="pointer-events-none absolute top-0 h-1 w-full">
					<div class="h-full w-1/4 animate-indeterminate bg-accent" />
				</div>
			)}

			<div
				ref={scrollRef}
				class="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-contain"
			>
				{
					/* @once */ images.map(({ fullsize, alt }, index) => {
						let finished = false;

						const finish = () => {
							if (finished) {
								return;
							}

							finished = true;
							setLoading(loading() - 1);
						};

						return (
							<div
								ref={bindImageWrapperRef(index)}
								onClick={handleImageWrapperClick}
								class="grid min-w-full snap-center snap-always place-items-center p-6"
							>
								<img
									src={fullsize}
									alt={alt}
									class="max-h-full max-w-full select-none"
									fetchpriority={index === initialActive ? 'high' : 'low'}
									draggable={false}
									onError={finish}
									onLoad={finish}
								/>
							</div>
						);
					})
				}
			</div>

			{(() => {
				if (!displayAlt()) {
					return;
				}

				const image = images[active()];
				const alt = image.alt;

				if (alt) {
					return (
						<div class="pointer-events-none absolute bottom-0 left-0 right-0 grid place-items-center">
							<div class="pointer-events-auto m-4 max-h-44 max-w-120 overflow-y-auto rounded-md bg-black/50 px-3 py-2 text-sm text-white backdrop-blur">
								<p class="whitespace-pre-wrap break-words drop-shadow">{alt}</p>
							</div>
						</div>
					);
				}
			})()}

			<div class="pointer-events-none fixed inset-x-0 top-0 z-20 flex h-13 items-center gap-2 px-2">
				<button
					title="Close viewer"
					onClick={() => {
						closeModal();
					}}
					class={iconButton}
				>
					<CloseIcon class="drop-shadow" />
				</button>

				{
					/* @once */ images.some((image) => !!image.alt) && (
						<button
							title="Toggle alternative text display"
							onClick={() => setDisplayAlt(!displayAlt())}
							class={clsx([altButton, displayAlt() && `is-active`])}
						>
							<span class="pl-0.5 pr-2 text-xs font-bold drop-shadow">ALT</span>
							<VisibilityOffIcon class="drop-shadow group-[.is-active]:hidden" />
							<VisibilityIcon class="hidden drop-shadow group-[.is-active]:block" />
						</button>
					)
				}

				<div class="grow"></div>

				{
					/* @once */ images.length > 1 && (
						<div class="rounded-full bg-black/50 px-2 py-0.5 text-de font-medium text-white backdrop-blur">
							<span class="drop-shadow">{`${active() + 1} of ${images.length}`}</span>
						</div>
					)
				}
			</div>

			{(() => {
				if (hasPrev()) {
					return (
						<div class="fixed left-2.5 top-1/2 z-20 -translate-y-1/2">
							<button title="Previous image" onClick={() => setActive(active() - 1)} class={iconButton}>
								<ArrowLeftIcon />
							</button>
						</div>
					);
				}
			})()}

			{(() => {
				if (hasNext()) {
					return (
						<div class="fixed right-2.5 top-1/2 z-20 -translate-y-1/2">
							<button title="Next image" onClick={() => setActive(active() + 1)} class={iconButton}>
								<ArrowLeftIcon class="rotate-180" />
							</button>
						</div>
					);
				}
			})()}
		</div>
	);
};

export default ImageViewerDialog;
