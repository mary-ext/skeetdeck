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

/*#__NO_SIDE_EFFECTS__*/
export const useMediaQuery = (query: string): Accessor<boolean> => {
	let media = map[query];

	if (!media) {
		const matcher = window.matchMedia(query);
		const [state, setState] = createSignal(matcher.matches);

		const callback = () => setState(matcher.matches);
		matcher.onchange = callback;

		media = map[query] = {
			n: 0,
			a: state,
			c: () => {
				if (--media.n < 1) {
					matcher.onchange = null;
					delete map[query];
				}
			},
		};
	}

	media.n++;
	onCleanup(media.c);

	return media.a;
};
