import { batch } from 'solid-js';

let flushing = false;
let queue: (() => void)[] = [];

export const schedule = (cb: () => void) => {
	queue.push(cb);

	if (!flushing) {
		flushing = true;
		setTimeout(flush, 0);
	}
};

const flush = () => {
	try {
		batch(() => {
			let len: number;
			while ((len = queue.length) > 0) {
				const queued = queue.splice(0, len);

				for (let idx = 0; idx < len; idx++) {
					queued[idx]();
				}
			}
		});
	} finally {
		flushing = false;
	}
};
