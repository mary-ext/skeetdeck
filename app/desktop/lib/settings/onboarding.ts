import type { DID } from '~/api/atp-schema';
import { getAccountData } from '~/api/globals/agent';

import { getCurrentTid } from '~/api/utils/tid';

import {
	type DeckConfig,
	PANE_TYPE_HOME,
	PANE_TYPE_NOTIFICATIONS,
	PANE_TYPE_PROFILE,
	ProfilePaneTab,
	SpecificPaneSize,
} from '../../globals/panes';
import { FILTER_ALL } from '~/api/queries/get-notifications';

export const createEmptyDeck = (): DeckConfig => {
	return {
		id: getCurrentTid(),
		name: 'Personal',
		emoji: '⭐',
		panes: [],
	};
};

export const createStarterDeck = (uid: DID): DeckConfig => {
	const data = getAccountData(uid)!;

	return {
		id: getCurrentTid(),
		name: 'Personal',
		emoji: '⭐',
		panes: [
			{
				type: PANE_TYPE_HOME,
				id: getCurrentTid(),
				uid: uid,
				size: SpecificPaneSize.INHERIT,
				title: null,
				showReplies: 'follows',
				showReposts: true,
				showQuotes: true,
			},
			{
				type: PANE_TYPE_NOTIFICATIONS,
				id: getCurrentTid(),
				uid: uid,
				size: SpecificPaneSize.INHERIT,
				title: null,
				mask: FILTER_ALL,
			},
			{
				type: PANE_TYPE_PROFILE,
				id: getCurrentTid(),
				uid: uid,
				size: SpecificPaneSize.INHERIT,
				title: null,
				profile: {
					did: uid,
					handle: data.session.handle,
				},
				tab: ProfilePaneTab.POSTS,
				tabVisible: true,
			},
		],
	};
};
