import { type JSX, createSignal, onCleanup } from 'solid-js';

import { resizeObserver, scrollObserver } from '~/utils/intersection-observer';

export interface VirtualContainerProps {
	estimateHeight?: number;
	class?: string;
	children?: JSX.Element;
}

export const VirtualContainer = (props: VirtualContainerProps) => {
	let _entry: IntersectionObserverEntry | undefined;
	let _height: number | undefined;
	let _intersecting = false;

	const estimateHeight = props.estimateHeight;

	const [intersecting, setIntersecting] = createSignal(_intersecting);
	const [storedHeight, setStoredHeight] = createSignal(estimateHeight);

	const shouldHide = () => !intersecting() && (estimateHeight ?? storedHeight()) !== undefined;

	const handleIntersect = (nextEntry: IntersectionObserverEntry) => {
		_entry = undefined;

		const prev = _intersecting;
		const next = nextEntry.isIntersecting;

		if (!prev && next) {
			// hidden -> visible
			setIntersecting((_intersecting = next));
		} else if (prev && !next) {
			// visible -> hidden
			// unmounting is cheap, but we don't need to immediately unmount it, say
			// for scenarios where layout is still being figured out and we don't
			// actually know where the virtual container is gonna end up.

			_entry = nextEntry;

			requestIdleCallback(() => {
				// bail out if it's no longer us.
				if (_entry !== nextEntry) {
					return;
				}

				_entry = undefined;
				setIntersecting((_intersecting = next));
			});
		}
	};

	const handleResize = (nextEntry: ResizeObserverEntry) => {
		if (!_intersecting) {
			return;
		}

		const contentRect = nextEntry.contentRect;
		const nextHeight = ((contentRect.height * 1000) | 0) / 1000;

		if (nextHeight !== _height) {
			setStoredHeight((_height = nextHeight));
		}
	};

	return (
		<article
			ref={startMeasure}
			class="virtual-item"
			style={{
				height: shouldHide() ? `${_height ?? storedHeight()}px` : undefined,
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
