let hasBoundingRectBug: boolean | undefined;

export const getRectFromEntry = (entry: IntersectionObserverEntry) => {
	if (hasBoundingRectBug === undefined) {
		const boundingRect = entry.target.getBoundingClientRect();
		const observerRect = entry.boundingClientRect;

		hasBoundingRectBug =
			boundingRect.height !== observerRect.height ||
			boundingRect.top !== observerRect.top ||
			boundingRect.width !== observerRect.width ||
			boundingRect.bottom !== observerRect.bottom ||
			boundingRect.left !== observerRect.left ||
			boundingRect.right !== observerRect.right;
	}

	return hasBoundingRectBug ? entry.target.getBoundingClientRect() : entry.boundingClientRect;
};

const callback: IntersectionObserverCallback = (entries, observer) => {
	for (let idx = 0, len = entries.length; idx < len; idx++) {
		const entry = entries[idx];

		const target = entry.target as any;
		const listener = target.$onintersect;

		if (listener) {
			listener(entry);
		} else {
			observer.unobserve(target);
		}
	}
};

export const scrollObserver = new IntersectionObserver(callback, { rootMargin: '106.25% 0px' });

declare module 'solid-js' {
	namespace JSX {
		interface ExplicitProperties {
			$onintersect: (entry: IntersectionObserverEntry) => void;
		}
	}
}
