import { createEffect, createRoot } from 'solid-js';
import { type StoreNode, createMutable, modifyMutable, reconcile } from 'solid-js/store';

type MigrateFn<T> = (version: number, prev: any) => T;

const parse = <T>(raw: string | null, migrate: MigrateFn<T>): [data: T, migrated: boolean] => {
	if (raw !== null) {
		try {
			const persisted = JSON.parse(raw);

			if (persisted != null) {
				const version = persisted.$version || 0;

				const data = migrate(version, persisted);
				const migrated = (data as any).$version !== version;

				return [data, migrated];
			}
		} catch {}
	}

	return [migrate(0, null), false];
};

export const createReactiveLocalStorage = <T extends StoreNode>(name: string, migrate: MigrateFn<T>) => {
	const [initialData, migrated] = parse(localStorage.getItem(name), migrate);

	const mutable = createMutable<T>(initialData);

	let writable = migrated;

	createRoot(() => {
		createEffect(() => {
			const json = JSON.stringify(mutable);

			if (writable) {
				localStorage.setItem(name, json);
			}
		});
	});

	window.addEventListener('storage', (ev) => {
		if (ev.key === name) {
			// Prevent our own effects from running, since this is already persisted.
			writable = false;
			modifyMutable(mutable, reconcile(parse(ev.newValue, migrate)[0], { merge: true }));
			writable = true;
		}
	});

	writable = true;
	return mutable;
};
