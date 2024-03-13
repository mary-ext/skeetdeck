import { type JSX, createMemo, createSignal, onMount } from 'solid-js';

import { makeEventListener } from '@solid-primitives/event-listener';

import { clsx } from '~/utils/misc';

import { closeModal } from '../../globals/modals';

import { Interactive } from '../../primitives/interactive';

import ArrowLeftIcon from '../../icons/baseline-arrow-left';
import CloseIcon from '../../icons/baseline-close';
import VisibilityIcon from '../../icons/baseline-visibility';
import VisibilityOffIcon from '../../icons/baseline-visibility-off';

const isMobile = import.meta.env.VITE_MODE === 'mobile';

const iconButton = Interactive({
	class: `pointer-events-auto grid h-8 w-8 place-items-center rounded-full bg-black/70 text-base text-white`,
});

const altButton = Interactive({
	class: `group pointer-events-auto flex h-8 place-items-center rounded-full bg-black/70 px-2 text-base text-white`,
});

export interface EmbeddedImage {
	fullsize: string;
	alt?: string;
}

export interface ImageViewerDialogProps {
	active?: number;
	images: EmbeddedImage[];
}

const enum GalleryNav {
	PREV,
	NEXT,
}

const ImageViewerDialog = (props: ImageViewerDialogProps) => {
	let scrollRef: HTMLDivElement;

	const images = props.images;
	const initialActive = props.active ?? 0;

	const [hidden, setHidden] = createSignal(false);
	const [displayAlt, setDisplayAlt] = createSignal(true);

	const [active, setActive] = createSignal(initialActive);

	const [loading, setLoading] = createSignal(images.length);

	const hasNext = createMemo(() => active() < images.length - 1);
	const hasPrev = createMemo(() => active() > 0);

	const observer = new IntersectionObserver(
		(entries) => {
			for (let idx = 0, len = entries.length; idx < len; idx++) {
				const entry = entries[idx];

				if (entry.isIntersecting) {
					setActive((entry.target as any)._index);
					return;
				}
			}
		},
		{ threshold: 0.5 },
	);

	const bindImageWrapperRef = (index: number) => {
		return (node: HTMLElement) => {
			(node as any)._index = index;
			observer.observe(node);
		};
	};

	const handleImageWrapperClick = (ev: MouseEvent) => {
		if (isMobile) {
			setHidden(!hidden());
		} else {
			closeModal();
		}
	};

	const bindNavClick = (nav: GalleryNav) => {
		return () => {
			const current = active();
			const delta = nav === GalleryNav.PREV ? -1 : 1;

			const next = current + delta;

			const children = [...scrollRef.childNodes];

			if (next < 0 || next > children.length - 1) {
				return;
			}

			const child = children[current + delta] as HTMLElement;

			child?.scrollIntoView({ inline: 'center' });
		};
	};

	onMount(() => {
		const children = [...scrollRef.childNodes];
		const child = children[active()] as HTMLElement;

		child.scrollIntoView({ inline: 'center', behavior: 'instant' });
	});

	makeEventListener(document.body, 'keydown', (ev) => {
		const key = ev.key;

		if (key === 'ArrowLeft') {
			ev.preventDefault();
			bindNavClick(GalleryNav.PREV)();
		} else if (key === 'ArrowRight') {
			ev.preventDefault();
			bindNavClick(GalleryNav.NEXT)();
		}
	});

	return (
		<div class={`h-full w-full overflow-hidden` + (!isMobile ? ` bg-black/90` : ` bg-black`)}>
			{loading() > 0 && (
				<div class="pointer-events-none absolute top-0 h-1 w-full">
					<div class="h-full w-1/4 animate-indeterminate bg-accent" />
				</div>
			)}

			<div
				ref={scrollRef!}
				class="flex h-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden overscroll-contain scrollbar-hide"
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
								class={
									`flex h-full w-full shrink-0 snap-center snap-always items-center justify-center py-6` +
									(!isMobile ? ` px-6` : ``)
								}
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
						<div
							class="pointer-events-none absolute bottom-0 left-0 right-0 grid place-items-center transition-opacity"
							classList={{ [`opacity-0`]: isMobile && hidden() }}
						>
							<div
								class={
									`pointer-events-auto max-h-44 max-w-120 overflow-y-auto bg-black/70 text-sm text-white` +
									(!isMobile ? ` m-4 rounded-md px-3 py-2` : ` w-full px-4 py-3`)
								}
							>
								<p class="whitespace-pre-wrap break-words drop-shadow">{alt}</p>
							</div>
						</div>
					);
				}
			})()}

			<div
				class="pointer-events-none fixed inset-x-0 top-0 z-20 flex h-13 items-center gap-2 px-2 transition-opacity"
				classList={{ [`opacity-0`]: isMobile && hidden() }}
			>
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
						<div class="rounded-full bg-black/70 px-2 py-0.5 text-de font-medium text-white">
							<span class="drop-shadow">{`${active() + 1} of ${images.length}`}</span>
						</div>
					)
				}
			</div>

			{!isMobile && [
				(() => {
					if (hasPrev()) {
						return (
							<div class="fixed left-2.5 top-1/2 z-20 -translate-y-1/2">
								<button title="Previous image" onClick={bindNavClick(GalleryNav.PREV)} class={iconButton}>
									<ArrowLeftIcon />
								</button>
							</div>
						);
					}
				}) as unknown as JSX.Element,
				(() => {
					if (hasNext()) {
						return (
							<div class="fixed right-2.5 top-1/2 z-20 -translate-y-1/2">
								<button title="Next image" onClick={bindNavClick(GalleryNav.NEXT)} class={iconButton}>
									<ArrowLeftIcon class="rotate-180" />
								</button>
							</div>
						);
					}
				}) as unknown as JSX.Element,
			]}
		</div>
	);
};

export default ImageViewerDialog;
