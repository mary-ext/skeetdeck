import { type JSX, createSignal, onCleanup } from 'solid-js';

import { scheduleIdleTask } from '~/utils/idle.ts';
import { getRectFromEntry, scrollObserver } from '~/utils/intersection-observer.ts';

export interface VirtualContainerProps {
	estimateHeight?: number;
	class?: string;
	children?: JSX.Element;
}

const isMobile = import.meta.env.VITE_MODE !== 'desktop' && /Android/.test(navigator.userAgent);

export const VirtualContainer = (props: VirtualContainerProps) => {
	let entry: IntersectionObserverEntry | undefined;
	let height: number | undefined;

	const estimateHeight = props.estimateHeight;

	const [intersecting, setIntersecting] = createSignal(false);
	const [cachedHeight, setCachedHeight] = createSignal(estimateHeight);

	const calculateHeight = () => {
		const nextHeight = getRectFromEntry(entry!).height;

		if (nextHeight !== height) {
			setCachedHeight((height = nextHeight));
		}
	};

	const handleIntersect = (nextEntry: IntersectionObserverEntry) => {
		const prev = intersecting();
		const next = nextEntry.isIntersecting;

		entry = nextEntry;

		// @todo: figure out why this is at all.
		// after scratching my head on and off for 12 hours, I've concluded that:
		//
		// 1. the broken assumption around how the virtual container attempts to
		//    store the height of items somehow makes scroll restoration work.
		//
		// 2. fixing this broken assumption somehow breaks scroll restoration.
		//
		// 3. this only happens on mobile browsers.
		//
		// my only assumption is that mobile phones are slow, but I am not willing
		// to spend more hours on this for now.

		if (!isMobile) {
			// new behavior.

			if (!prev && next) {
				// hidden -> visible
				// immediately mount the children, then schedule a task to update the
				// cached height, this handles the scenario where the virtual container
				// gets unmounted without ever being out-of-bounds.
				setIntersecting(next);

				// @todo: this is more meant for mobile web app where navigation blows
				// the entire page away, if we're making use of Suspense for offscreen
				// rendering then this shouldn't be necessary at all.
				if (isMobile) {
					scheduleIdleTask(() => {
						// bail out if it's no longer us.
						if (entry !== nextEntry) {
							return;
						}

						calculateHeight();
					});
				}
			} else if (prev && !next) {
				// visible -> hidden
				// unmounting is cheap, but we don't need to immediately unmount it, say
				// for scenarios where layout is still being figured out and we don't
				// actually know where the virtual container is gonna end up.
				scheduleIdleTask(() => {
					// bail out if it's no longer us.
					if (entry !== nextEntry) {
						return;
					}

					calculateHeight();
					setIntersecting(next);
				});
			}
		} else {
			// old behavior.

			if (!prev && next) {
				// hidden -> visible
				scheduleIdleTask(calculateHeight);
			}

			setIntersecting(next);
		}
	};

	const shouldHide = () => !intersecting() && cachedHeight() !== undefined;

	return (
		<article
			ref={startMeasure}
			class={props.class}
			style={{ height: shouldHide() ? `${height ?? cachedHeight()}px` : undefined }}
			prop:$onintersect={handleIntersect}
		>
			{(() => {
				if (!shouldHide()) {
					return props.children;
				}
			})()}
		</article>
	);
};

const startMeasure = (node: HTMLElement) => {
	scrollObserver.observe(node);

	onCleanup(() => {
		scrollObserver.unobserve(node);
	});
};
