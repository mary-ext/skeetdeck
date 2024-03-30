import type { SignalizedProfile } from '../stores/profiles';

import { ContextProfileList, getModerationUI, type ModerationOptions } from '.';
import { moderateProfile } from './entities/profile';

export const moderateProfileList = (
	profiles: SignalizedProfile[] | undefined,
	opts: ModerationOptions,
): SignalizedProfile[] | undefined => {
	if (profiles) {
		return profiles.filter((profile) => {
			const causes = moderateProfile(profile, opts);
			const ui = getModerationUI(causes, ContextProfileList);

			return ui.f.length === 0;
		});
	}
};
