import { type JSX, Show, createSignal } from 'solid-js';

import { scheduleIdleTask } from '~/utils/idle.ts';
import { getRectFromEntry, scrollObserver } from '~/utils/intersection-observer.ts';

export interface VirtualContainerProps {
	estimateHeight?: number;
	class?: string;
	children?: JSX.Element;
}

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

		// @todo: figure out why this is. not sure why scroll restoration is broken
		// with this approach on mobile.
		if (import.meta.env.VITE_APP_MODE === 'desktop') {
			if (!prev && next) {
				// Hidden -> Visible
				setIntersecting(next);

				scheduleIdleTask(() => {
					// Bail out if it's no longer us.
					if (entry !== nextEntry) {
						return;
					}

					calculateHeight();
				});
			} else if (prev && !next) {
				// Visible -> Hidden
				scheduleIdleTask(() => {
					// Bail out if it's no longer us.
					if (entry !== nextEntry) {
						return;
					}

					calculateHeight();
					setIntersecting(next);
				});
			}
		} else {
			if (!prev && next) {
				// Hidden -> Visible
				scheduleIdleTask(calculateHeight);
			}

			setIntersecting(next);
		}
	};

	const measure = (node: HTMLElement) => scrollObserver.observe(node);
	const shouldHide = () => !intersecting() && cachedHeight() !== undefined;

	return (
		<article
			ref={measure}
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
