import { createSignal } from 'solid-js';
import { registerSW } from 'virtual:pwa-register';

const REGISTER_SW = true;

const [isUpdateReady, setIsUpdateReady] = createSignal(false);

const updateSW = REGISTER_SW
	? registerSW({
			onNeedRefresh() {
				setIsUpdateReady(true);
			},
		})
	: () => {};

export { isUpdateReady, updateSW };
