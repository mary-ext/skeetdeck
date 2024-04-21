import { batch, createEffect, createRoot, onCleanup } from 'solid-js';

import type { AppBskyLabelerDefs, At } from '~/api/atp-schema';
import { publicAppView } from '~/api/globals/agent';

import { interpretServiceDefinition, mergeServiceDefinition } from '~/api/moderation/service';

import { preferences } from '~/desktop/globals/settings';

let _dispose: (() => void) | undefined;

const bc = new BroadcastChannel('scheduled');

const start = () => {
	if (_dispose) {
		return;
	}

	bc.postMessage('focused');

	createRoot((dispose) => {
		_dispose = dispose;

		const parent = createAbort();

		// Moderation services update
		createEffect(() => {
			const signal = createAbort(parent);

			const moderation = preferences.moderation;

			const updatedAt = moderation.updatedAt;
			const services = moderation.services;

			const nextUpdatedAt = updatedAt + 21_600_000;
			const delta = nextUpdatedAt - Date.now();

			sleep(delta, signal).then(async () => {
				let views: AppBskyLabelerDefs.LabelerViewDetailed[] | undefined;
				try {
					const response = await publicAppView.get('app.bsky.labeler.getServices', {
						params: {
							dids: services.map((service) => service.did),
							detailed: true,
						},
					});

					views = response.data.views as AppBskyLabelerDefs.LabelerViewDetailed[];
				} catch {}

				batch(() => {
					if (views) {
						const mapping = new Map(views.map((view) => [view.creator.did, view]));

						for (const service of services) {
							const next = mapping.get(service.did);

							if (!next) {
								service.deleted = true;
								continue;
							}

							service.deleted = undefined;
							mergeServiceDefinition(service, interpretServiceDefinition(next));
						}
					}

					moderation.updatedAt = Date.now();
				});
			});
		});

		// Temporary mutes update
		createEffect(() => {
			const signal = createAbort(parent);

			const tempMutes = preferences.moderation.tempMutes;

			const nextAt = Object.values(tempMutes).reduce<number>((time, x) => {
				return x !== undefined && x < time ? x : time;
			}, Infinity);

			if (nextAt === Infinity) {
				return;
			}

			const delta = nextAt - Date.now();

			sleep(delta, signal).then(() => {
				batch(() => {
					const now = Date.now();

					for (const key in tempMutes) {
						const value = tempMutes[key as At.DID];

						if (value === undefined || value <= now) {
							delete tempMutes[key as At.DID];
						}
					}
				});
			});
		});
	});
};

const sleep = (ms: number, signal?: AbortSignal): Promise<void> => {
	return new Promise((resolve) => {
		if (signal?.aborted) {
			return;
		}

		if (ms < 1) {
			return resolve();
		}

		const c = () => clearTimeout(timeout);

		const timeout = setTimeout(() => {
			resolve();
			signal?.removeEventListener('abort', c);
		}, ms);

		signal?.addEventListener('abort', c);
	});
};

const createAbort = (parent?: AbortSignal) => {
	const controller = new AbortController();
	const signal = controller.signal;

	if (parent) {
		if (parent.aborted) {
			controller.abort(parent.reason);
		} else {
			parent.addEventListener('abort', () => controller.abort(parent.reason), { signal });
		}
	}

	onCleanup(() => {
		controller.abort();
	});

	return signal;
};

bc.onmessage = (ev) => {
	if (ev.data === 'focused' && _dispose) {
		const dispose = _dispose;
		_dispose = undefined;

		dispose();
	}
};

window.addEventListener('focus', start);
start();
