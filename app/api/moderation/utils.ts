import type { SignalizedProfile } from '../stores/profiles';

import { type ModerationOptions, ContextProfileList, getModerationUI } from '.';
import { moderateProfile } from './entities/profile';

export const moderateProfileList = (
	profiles: SignalizedProfile[],
	opts: ModerationOptions | undefined,
): SignalizedProfile[] => {
	if (opts) {
		return profiles.filter((profile) => {
			const causes = moderateProfile(profile, opts);
			const ui = getModerationUI(causes, ContextProfileList);

			return ui.f.length === 0;
		});
	}

	return profiles;
};
