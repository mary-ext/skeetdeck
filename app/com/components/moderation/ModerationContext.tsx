import { createContext, useContext } from 'solid-js';

import { type ModerationOpts } from '~/api/moderation/types.ts';

export const ModerationContext = createContext<ModerationOpts>();

export const useModeration = () => {
	return useContext(ModerationContext)!;
};
