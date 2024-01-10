import { createSignal } from 'solid-js';
import { registerSW } from 'virtual:pwa-register';

const REGISTER_SW = true;

const [isUpdateReady, setIsUpdateReady] = createSignal(false);
const [registration, setRegistration] = createSignal<ServiceWorkerRegistration>();

const updateSW = REGISTER_SW
	? registerSW({
			onNeedRefresh() {
				setIsUpdateReady(true);
			},
			onRegisteredSW(_swScriptUrl, reg) {
				setRegistration(reg);
			},
		})
	: () => {};

export { isUpdateReady, updateSW, registration };
