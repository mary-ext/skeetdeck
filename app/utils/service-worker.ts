import { createSignal } from 'solid-js';
import { registerSW } from 'virtual:pwa-register';

const REGISTER_SW = true;

const [updateStatus, setUpdateStatus] = createSignal<0 | 1 | 2>(0);
const [registration, setRegistration] = createSignal<ServiceWorkerRegistration>();

const updateSW = REGISTER_SW
	? registerSW({
			onNeedRefresh() {
				setUpdateStatus(2);
			},
			onBeginUpdate() {
				setUpdateStatus(1);
			},
			onOfflineReady() {
				setUpdateStatus(0);
			},
			onRegisteredSW(_swScriptUrl, reg) {
				setRegistration(reg);
			},
		})
	: () => {};

export { updateStatus, updateSW, registration };
