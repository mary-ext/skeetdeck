import { createSignal, onCleanup } from 'solid-js';

import { UNSAFE_useViewContext } from '@pkg/solid-navigation';

import { resizeObserver, scrollObserver } from '~/utils/intersection-observer';

import type { VirtualContainerProps } from './VirtualContainer';

interface ContainerContext {
	active: boolean;
}

const mapping = new WeakMap<ReturnType<typeof UNSAFE_useViewContext>, ContainerContext>();

// Only set up one focus and blur listeners for the all virtual containers.
const getContainerContext = () => {
	const view = UNSAFE_useViewContext();

	let context = mapping.get(view);
	if (context === undefined) {
		mapping.set(view, (context = { active: true }));

		view.focusHandlers.push(() => (context!.active = true));
		view.blurHandlers.push(() => (context!.active = false));
	}

	return context;
};

export const VirtualContainer = (props: VirtualContainerProps) => {
	let entry: IntersectionObserverEntry | undefined;
	let height: number | undefined;

	const context = getContainerContext();

	const estimateHeight = props.estimateHeight;

	const [intersecting, setIntersecting] = createSignal(false);
	const [cachedHeight, setCachedHeight] = createSignal(estimateHeight);

	const shouldHide = () => !intersecting() && cachedHeight() !== undefined;

	const handleIntersect = (nextEntry: IntersectionObserverEntry) => {
		entry = nextEntry;

		if (!context.active) {
			return;
		}

		const prev = intersecting();
		const next = nextEntry.isIntersecting;

		if (!prev && next) {
			// hidden -> visible
			setIntersecting(next);
		} else if (prev && !next) {
			// visible -> hidden
			// unmounting is cheap, but we don't need to immediately unmount it, say
			// for scenarios where layout is still being figured out and we don't
			// actually know where the virtual container is gonna end up.
			requestIdleCallback(() => {
				// bail out if it's no longer us.
				if (entry !== nextEntry) {
					return;
				}

				setIntersecting(next);
			});
		}
	};

	const handleResize = (nextEntry: ResizeObserverEntry) => {
		if (shouldHide()) {
			return;
		}

		const contentRect = nextEntry.contentRect;
		const nextHeight = Math.trunc(contentRect.height * 1000) / 1000;

		if (nextHeight !== height) {
			setCachedHeight((height = nextHeight));
		}
	};

	return (
		<article
			ref={startMeasure}
			class={props.class}
			style={{
				contain: 'content',
				height: shouldHide() ? `${height ?? cachedHeight()}px` : undefined,
			}}
			prop:$onintersect={handleIntersect}
			prop:$onresize={handleResize}
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
	resizeObserver.observe(node);

	onCleanup(() => {
		scrollObserver.unobserve(node);
		resizeObserver.unobserve(node);
	});
};

declare class ContentVisibilityAutoStateChangeEvent extends Event {
	readonly target: HTMLElement;
	readonly currentTarget: HTMLElement;
	readonly skipped: boolean;
}

declare module 'solid-js' {
	namespace JSX {
		interface ExplicitProperties {
			oncontentvisibilityautostatechange: (ev: ContentVisibilityAutoStateChangeEvent) => void;
		}
	}
}
