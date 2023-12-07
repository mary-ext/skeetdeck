import { createSignal } from 'solid-js';
import { registerSW } from 'virtual:pwa-register';

const [isUpdateReady, setIsUpdateReady] = createSignal(false);

const updateSW = registerSW({
	onNeedRefresh() {
		setIsUpdateReady(true);
	},
});

export { isUpdateReady, updateSW };
