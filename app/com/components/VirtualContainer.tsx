import { type JSX, createSignal } from 'solid-js';

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

	const shouldHide = () => !intersecting() && cachedHeight();

	return (
		<article
			ref={measure}
			class={props.class}
			style={{ height: shouldHide() ? `${height || cachedHeight()}px` : undefined }}
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
