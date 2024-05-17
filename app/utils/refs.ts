import { createEffect } from 'solid-js';
import { scrollObserver } from './intersection-observer';

export const ifIntersect = (enabled: () => boolean | undefined, onIntersect: (() => void) | undefined) => {
	if (!onIntersect) {
		return;
	}

	return (node: HTMLElement) => {
		createEffect(() => {
			if (enabled()) {
				// @ts-expect-error
				if (node.$onintersect === undefined) {
					// @ts-expect-error
					node.$onintersect = (entry: IntersectionObserverEntry) => {
						if (entry.isIntersecting) {
							onIntersect();
						}
					};

					scrollObserver.observe(node);
				}
			} else {
				// @ts-expect-error
				if (node.$onintersect !== undefined) {
					// @ts-expect-error
					node.$onintersect = undefined;

					scrollObserver.unobserve(node);
				}
			}
		});
	};
};
