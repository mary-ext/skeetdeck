import { batch } from 'solid-js';

import type { AppBskyLabelerDefs } from '~/api/atp-schema';
import { publicAppView } from '~/api/globals/agent';

import { interpretServiceDefinition, mergeServiceDefinition } from '~/api/moderation/service';

import { preferences } from '../../globals/settings';

const moderation = preferences.moderation;

const requestLock = async () => {
	await navigator.locks.request('moderation', async () => {
		const updatedAt = moderation.updatedAt;
		const nextUpdatedAt = updatedAt + 21_600_000;

		const delta = nextUpdatedAt - Date.now();

		if (delta > 0) {
			await new Promise((resolve) => setTimeout(resolve, delta));
		}

		let views: AppBskyLabelerDefs.LabelerViewDetailed[] | undefined;
		try {
			const response = await publicAppView.get('app.bsky.labeler.getServices', {
				params: {
					dids: moderation.services.map((service) => service.did),
					detailed: true,
				},
			});

			views = response.data.views as AppBskyLabelerDefs.LabelerViewDetailed[];
		} catch {}

		batch(() => {
			if (views) {
				const mapping = new Map(views.map((view) => [view.creator.did, view]));

				for (const service of moderation.services) {
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

	requestLock();
};

requestLock();
