import { createEffect, createRoot } from 'solid-js';
import { type StoreNode, createMutable, modifyMutable, reconcile } from 'solid-js/store';

type MigrateFn<T> = (version: number, prev: any) => T;

const parse = <T>(raw: string | null, migrate: MigrateFn<T>): T => {
	if (raw !== null) {
		try {
			const persisted = JSON.parse(raw);

			if (persisted != null) {
				return migrate(persisted.$version || 0, persisted);
			}
		} catch {}
	}

	return migrate(0, null);
};

export const createReactiveLocalStorage = <T extends StoreNode>(name: string, migrate: MigrateFn<T>) => {
	const mutable = createMutable<T>(parse(localStorage.getItem(name), migrate));

	let writable = true;

	createRoot(() => {
		createEffect((changed: boolean) => {
			const json = JSON.stringify(mutable);

			if (writable && changed) {
				localStorage.setItem(name, json);
			}

			return true;
		}, false);
	});

	window.addEventListener('storage', (ev) => {
		if (ev.key === name) {
			// Prevent our own effects from running, since this is already persisted.
			writable = false;
			modifyMutable(mutable, reconcile(parse(ev.newValue, migrate), { merge: true }));
			writable = true;
		}
	});

	return mutable;
};
