import '@pkg/solid-query';

import type { ModerationOpts } from './moderation/types.ts';
import type { FilterPreferences, LanguagePreferences } from './types.ts';

declare module '@pkg/solid-query' {
	interface Register {
		queryMeta: {
			batched?: boolean;
			timelineOpts?: {
				moderation: ModerationOpts;
				filters: FilterPreferences;
				language: LanguagePreferences;
			};
		};
	}
}
