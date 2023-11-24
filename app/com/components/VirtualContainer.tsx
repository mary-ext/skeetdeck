import { type JSX, createSignal, createMemo } from 'solid-js';

import { scheduleIdleTask } from '~/utils/idle.ts';
import { getRectFromEntry, scrollObserver } from '~/utils/intersection-observer.ts';

export interface VirtualContainerProps {
	estimateHeight?: number;
	class?: string;
	children?: JSX.Element;
}

export const VirtualContainer = (props: VirtualContainerProps) => {
	let entry: IntersectionObserverEntry | undefined;
	let height: number | undefined = props.estimateHeight;

	const [intersecting, setIntersecting] = createSignal(false);
	const [cachedHeight, setCachedHeight] = createSignal(height);

	const calculateHeight = () => {
		const next = getRectFromEntry(entry!).height;

		if (next !== height) {
			height = next;
			setCachedHeight(next);
		}
	};

	const handleIntersect = (next: IntersectionObserverEntry) => {
		const intersect = next.isIntersecting;

		entry = next;

		if (intersect && !intersecting()) {
			scheduleIdleTask(calculateHeight);
		}

		setIntersecting(intersect);
	};

	const measure = (node: HTMLElement) => scrollObserver.observe(node);

	const hasHeightCached =
		height === undefined ? createMemo(() => (height ?? cachedHeight()) !== undefined) : () => true;
	const shouldHide = () => !intersecting() && hasHeightCached();

	return (
		<article
			ref={measure}
			class={props.class}
			style={{ height: shouldHide() ? `${cachedHeight()}px` : undefined }}
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
