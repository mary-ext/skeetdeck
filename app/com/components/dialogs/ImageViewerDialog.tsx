import { For, JSX, batch, createEffect, createMemo, createSignal, onCleanup, onMount } from 'solid-js';

import { type Vector2, createGesture } from '@pkg/solid-use-gesture';

import { closeModal } from '../../globals/modals.tsx';

import { createDerivedSignal } from '~/utils/hooks.ts';
import { useMediaQuery } from '~/utils/media-query.ts';

import ArrowLeftIcon from '../../icons/baseline-arrow-left.tsx';
import CloseIcon from '../../icons/baseline-close.tsx';

export interface EmbeddedImage {
	fullsize: string;
	alt?: string;
}

export interface ImageViewerDialogProps {
	active?: number;
	images: EmbeddedImage[];
}

const ImageViewerDialog = (props: ImageViewerDialogProps) => {
	const [active, setActive] = createDerivedSignal(() => props.active || 0);

	const isFine = useMediaQuery('(pointer: fine)');

	const images = () => props.images;

	const hasNext = createMemo(() => active() < images().length - 1);
	const hasPrev = createMemo(() => active() > 0);

	onMount(() => {
		const keydownListener = (ev: KeyboardEvent) => {
			const key = ev.key;

			if (key === 'ArrowLeft') {
				ev.preventDefault();

				if (hasPrev()) {
					setActive(active() - 1);
				}
			} else if (key === 'ArrowRight') {
				ev.preventDefault();

				if (hasNext()) {
					setActive(active() + 1);
				}
			} else if (key === 'ArrowUp' || key === 'ArrowDown') {
				ev.preventDefault();
			}
		};

		document.body.addEventListener('keydown', keydownListener);
		onCleanup(() => document.body.removeEventListener('keydown', keydownListener));
	});

	return (
		<>
			<ImageCarousel
				active={active()}
				images={images()}
				onActiveChange={setActive}
				onClose={() => closeModal()}
			/>

			{(() => {
				if (isFine()) {
					return [
						(() => {
							if (hasPrev()) {
								return (
									<button
										title="Previous image"
										onClick={() => setActive(active() - 1)}
										class="fixed left-2.5 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black text-base text-white hover:bg-secondary/40"
									>
										<ArrowLeftIcon />
									</button>
								);
							}
						}) as unknown as JSX.Element,
						(() => {
							if (hasNext()) {
								return (
									<button
										title="Next image"
										onClick={() => setActive(active() + 1)}
										class="fixed right-2.5 top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black text-base text-white hover:bg-secondary/40"
									>
										<ArrowLeftIcon class="rotate-180" />
									</button>
								);
							}
						}) as unknown as JSX.Element,
					];
				}
			})()}

			<button
				title="Close viewer"
				onClick={() => {
					closeModal();
				}}
				class="fixed left-2.5 top-2.5 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black text-base text-white hover:bg-secondary/40"
			>
				<CloseIcon />
			</button>
		</>
	);
};

export default ImageViewerDialog;

// Based on the following code:
// https://github.com/elk-zone/elk/blob/a94fe1c9d005267d8e73efc9c21d6f0382141c0b/components/modal/ModalMediaPreviewCarousel.vue
// Licensed under MIT License

interface ImageCarouselProps {
	active: number;
	images: EmbeddedImage[];
	onActiveChange: (next: number) => void;
	onClose: () => void;
}

const SLIDE_GAP = 20;
// const DOUBLE_TAP_THRESHOLD = 250;

const createTimeout = (ms: number) => {
	const [ready, setReady] = createSignal(false);

	const timeout = setTimeout(() => setReady(true), ms);
	onCleanup(() => clearInterval(timeout));

	return ready;
};

const ImageCarousel = (props: ImageCarouselProps) => {
	let view: HTMLDivElement | undefined;
	let slider: HTMLDivElement | undefined;

	// let lastTapAt = 0;
	// let lastOrigin: Vector2 = [0, 0];
	// let initialScale = 0;

	const onActiveChange = (next: number) => props.onActiveChange(next);
	const onClose = () => props.onClose();

	const active = () => props.active;
	const images = () => props.images;

	const isReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
	const isInitialScrollDone = createTimeout(350);
	const canAnimate = () => !isReducedMotion() && isInitialScrollDone();

	// const [scale, setScale] = createSignal(1);
	const [x, setX] = createSignal(0);
	const [y, setY] = createSignal(0);

	const [dragging, setDragging] = createSignal(false);
	// const [pinching, setPinching] = createSignal(false);

	// const [maxZoomOut, setMaxZoomOut] = createSignal(1);

	// const isZoomedIn = () => scale() > 1;

	const [loading, setLoading] = createSignal(0);

	const goToFocusedSlide = () => {
		const $active = active();
		const slide = slider!.childNodes[$active] as HTMLDivElement;

		// setScale(1);
		// setX(slide.offsetLeft * untrack(scale));
		setX(slide.offsetLeft);
		setY(0);
	};

	// const shiftRestrictions = () => {
	// 	const $active = active();
	// 	const $scale = scale();

	// 	const focusedSlide = slider!.childNodes[$active] as HTMLDivElement;
	// 	const focusedImage = focusedSlide.firstChild as HTMLImageElement;

	// 	const scaledImageWidth = focusedImage.offsetWidth * $scale;
	// 	const scaledHorizontalOverflow = scaledImageWidth / 2 - view!.clientWidth / 2 + SLIDE_GAP;
	// 	const horizontalOverflow = Math.max(0, scaledHorizontalOverflow / $scale);

	// 	const scaledImageHeight = focusedImage.offsetHeight * $scale;
	// 	const scaledVerticalOverflow = scaledImageHeight / 2 - view!.clientHeight / 2 + SLIDE_GAP;
	// 	const verticalOverflow = Math.max(0, scaledVerticalOverflow / $scale);

	// 	return {
	// 		left: focusedSlide.offsetLeft - horizontalOverflow,
	// 		right: focusedSlide.offsetLeft + horizontalOverflow,
	// 		top: focusedSlide.offsetTop - verticalOverflow,
	// 		bottom: focusedSlide.offsetTop + verticalOverflow,
	// 	};
	// };

	// const handlePinchZoom = (
	// 	initialScale: number,
	// 	initialDistance: number,
	// 	distance: number,
	// 	[originX, originY]: Vector2,
	// ) => {
	// 	setScale(initialScale * (distance / initialDistance));
	// 	setScale(Math.max(maxZoomOut(), scale()));

	// 	const deltaCenterX = originX - lastOrigin[0];
	// 	const deltaCenterY = originY - lastOrigin[1];

	// 	handleZoomDrag([deltaCenterX, deltaCenterY]);
	// };

	// const handleMouseWheelZoom = (initialScale: number, deltaDistance: number, [originX, originY]: Vector2) => {
	// 	setScale(initialScale + deltaDistance / 1000);
	// 	setScale(Math.max(maxZoomOut(), scale()));

	// 	const deltaCenterX = lastOrigin[0] - originX;
	// 	const deltaCenterY = lastOrigin[1] - originY;

	// 	handleZoomDrag([deltaCenterX, deltaCenterY]);
	// };

	const handleLastDrag = (tap: boolean, swipe: Vector2, movement: Vector2, _position: Vector2) => {
		setDragging(false);

		if (tap) {
			// handleTap(position);
		} else if (swipe[0] || swipe[1]) {
			handleSwipe(swipe, movement);
		} else if (true /* && !isZoomedIn() */) {
			slideToClosestSlide();
		}
	};

	// const handleTap = ([positionX, positionY]: Vector2) => {
	// 	const now = Date.now();
	// 	const isDoubleTap = now - lastTapAt < DOUBLE_TAP_THRESHOLD;
	// 	lastTapAt = now;

	// 	if (!isDoubleTap) {
	// 		return;
	// 	}

	// 	if (isZoomedIn()) {
	// 		goToFocusedSlide();
	// 	} else {
	// 		const $active = active();
	// 		const focusedSlide = slider!.childNodes[$active] as HTMLDivElement;
	// 		const focusedSlideBounding = focusedSlide.getBoundingClientRect();

	// 		const slideCenterX = focusedSlideBounding.left + focusedSlideBounding.width / 2;
	// 		const slideCenterY = focusedSlideBounding.top + focusedSlideBounding.height / 2;

	// 		setScale(3);
	// 		setX(x() + positionX - slideCenterX);
	// 		setY(y() + positionY - slideCenterY);
	// 		restrictShiftToInsideSlide();
	// 	}
	// };

	const handleSwipe = ([horiz, vert]: Vector2, [movementX, movementY]: Vector2) => {
		// if (isZoomedIn() || pinching()) {
		// 	return;
		// }

		const isHorizontalDrag = Math.abs(movementX) >= Math.abs(movementY);

		if (isHorizontalDrag) {
			if (horiz === 1) {
				// left
				onActiveChange(Math.max(0, active() - 1));
			}
			if (horiz === -1) {
				// right
				onActiveChange(Math.min(images().length - 1, active() + 1));
			}
		} else if (vert === 1 || vert === -1) {
			onClose();
		}

		goToFocusedSlide();
	};

	const slideToClosestSlide = () => {
		const $active = active();
		const focusedSlide = slider!.childNodes[$active] as HTMLDivElement;

		const startOfFocusedSlide = focusedSlide.offsetLeft; /* * scale() */
		const slideWidth = focusedSlide.offsetWidth; /* * scale() */

		if (x() > startOfFocusedSlide + slideWidth / 2) {
			onActiveChange(Math.min(images().length - 1, $active + 1));
		} else if (x() < startOfFocusedSlide - slideWidth / 2) {
			onActiveChange(Math.max(0, $active - 1));
		}

		goToFocusedSlide();
	};

	const handleDrag = (_delta: Vector2, movement: Vector2) => {
		setDragging(true);

		// if (isZoomedIn()) {
		// 	handleZoomDrag(delta);
		// } else {
		// 	handleSlideDrag(movement)
		// }

		handleSlideDrag(movement);
	};

	// const handleZoomDrag = ([deltaX, deltaY]: Vector2) => {
	// 	const $scale = scale();

	// 	setX(x() - deltaX / $scale);
	// 	setY(y() - deltaY / $scale);

	// 	restrictShiftToInsideSlide();
	// };

	const handleSlideDrag = ([movementX, movementY]: Vector2) => {
		goToFocusedSlide();

		if (Math.abs(movementY) > Math.abs(movementX)) {
			// vertical movement is more then horizontal
			setY(y() - movementY /* / scale() */);
		} else {
			setX(x() - movementX /* / scale() */);
		}

		if (images().length === 1) {
			setX(0);
		}
	};

	// const restrictShiftToInsideSlide = () => {
	// 	const $shiftRestrictions = shiftRestrictions();

	// 	setX(Math.min($shiftRestrictions.right, Math.max($shiftRestrictions.left, x())));
	// 	setY(Math.min($shiftRestrictions.bottom, Math.max($shiftRestrictions.top, y())));
	// };

	onMount(() => {
		// const gapAsScale = SLIDE_GAP / view!.clientWidth;
		// setMaxZoomOut(1 - gapAsScale);

		createEffect(goToFocusedSlide);

		createGesture(
			{
				// onPinch({
				// 	first,
				// 	initial: [initialDistance],
				// 	movement: [deltaDistance],
				// 	da: [distance],
				// 	origin,
				// 	touches,
				// }) {
				// 	batch(() => {
				// 		setPinching(true);

				// 		if (first) {
				// 			initialScale = scale();
				// 		} else {
				// 			if (touches === 0) {
				// 				handleMouseWheelZoom(initialScale, deltaDistance, origin);
				// 			} else {
				// 				handlePinchZoom(initialScale, initialDistance, distance, origin);
				// 			}
				// 		}

				// 		lastOrigin = origin;
				// 	});
				// },

				// onPinchEnd() {
				// 	batch(() => {
				// 		setPinching(false);
				// 		setDragging(false);

				// 		if (!isZoomedIn()) {
				// 			goToFocusedSlide();
				// 		}
				// 	});
				// },

				onDrag({ movement, delta, pinching, tap, last, swipe, event, xy }) {
					event.preventDefault();

					if (pinching) {
						return;
					}

					batch(() => {
						if (last) {
							handleLastDrag(tap, swipe, movement, xy);
						} else {
							handleDrag(delta, movement);
						}
					});
				},
			},
			{
				target: view!,
				eventOptions: {
					passive: false,
				},
			},
		);
	});

	return (
		<div
			ref={view}
			class="relative flex h-full w-full touch-none overflow-hidden bg-black/75"
			style={{ cursor: dragging() ? 'grabbing' : 'grab' }}
		>
			<div
				ref={slider}
				class="flex h-full w-full items-center"
				style={{
					transition: canAnimate() && !dragging() /* && !pinching() */ ? `all 0.3s ease` : 'none',
					// scale: `${scale()}`,
					// translate: `${-x()}px ${-y()}px`,
					translate: `${-x()}px 0px`,
					gap: `${SLIDE_GAP}px`,
				}}
			>
				<For each={images()}>
					{(image) => {
						const finish = () => setLoading(($loading) => $loading - 1);

						setLoading(($loading) => $loading + 1);

						return (
							<div class="flex h-full w-full shrink-0 items-center justify-center p-6">
								<img
									src={image.fullsize}
									alt={image.alt}
									class="max-h-full max-w-full select-none"
									draggable={false}
									onError={finish}
									onLoad={finish}
								/>
							</div>
						);
					}}
				</For>
			</div>

			{loading() > 0 && (
				<div class="pointer-events-none absolute top-0 h-1 w-full">
					<div class="h-full w-1/4 animate-indeterminate bg-accent" />
				</div>
			)}
		</div>
	);
};
