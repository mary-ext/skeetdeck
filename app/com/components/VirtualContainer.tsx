import { createSignal, onCleanup, type JSX } from 'solid-js';

import { scrollObserver } from '~/utils/intersection-observer';

export interface VirtualContainerProps {
	estimateHeight?: number;
	class?: string;
	children?: JSX.Element;
}

export const VirtualContainer = (props: VirtualContainerProps) => {
	let _entry: IntersectionObserverEntry | undefined;
	let _height: number | undefined = props.estimateHeight;
	let _intersecting: boolean = false;

	const [intersecting, setIntersecting] = createSignal(_intersecting);

	const shouldHide = () => !intersecting() && _height !== undefined;

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

				// reduce the precision
				_height = ((_entry.boundingClientRect.height * 1000) | 0) / 1000;
				_entry = undefined;

				setIntersecting((_intersecting = next));
			});
		}
	};

	return (
		<article
			ref={startMeasure}
			class={props.class}
			style={{
				contain: 'content',
				height: shouldHide() ? `${_height ?? 0}px` : undefined,
			}}
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
