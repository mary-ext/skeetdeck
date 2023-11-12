import { type Accessor, createSignal, onCleanup } from 'solid-js';

interface MediaStore {
	/** State backing */
	a: Accessor<boolean>;
	/** Amount of subscriptions */
	n: number;
	/** Cleanup function */
	c: () => void;
}

const map: Record<string, MediaStore> = {};

export const useMediaQuery = (query: string): Accessor<boolean> => {
	let media = map[query];

	if (!media) {
		const matcher = window.matchMedia(query);
		const [state, setState] = createSignal(matcher.matches);

		const callback = () => setState(matcher.matches);

		matcher.addEventListener('change', callback);

		media = map[query] = {
			n: 0,
			a: state,
			c: () => {
				if (--media.n < 1) {
					delete map[query];
					matcher.removeEventListener('change', callback);
				}
			},
		};
	}

	media.n++;
	onCleanup(media.c);

	return media.a;
};
