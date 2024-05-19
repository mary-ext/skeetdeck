import * as TID from '@mary/atproto-tid';

import type { At } from '~/api/atp-schema';
import { getAccountData } from '~/api/globals/agent';

import { FILTER_ALL } from '~/api/queries/get-notifications';
import {
	PANE_TYPE_HOME,
	PANE_TYPE_NOTIFICATIONS,
	PANE_TYPE_PROFILE,
	ProfilePaneTab,
	SpecificPaneSize,
	type DeckConfig,
} from '../../globals/panes';

export const createEmptyDeck = (): DeckConfig => {
	return {
		id: TID.now(),
		name: 'Personal',
		emoji: '⭐',
		panes: [],
	};
};

export const createStarterDeck = (uid: At.DID): DeckConfig => {
	const data = getAccountData(uid)!;

	return {
		id: TID.now(),
		name: 'Personal',
		emoji: '⭐',
		panes: [
			{
				type: PANE_TYPE_HOME,
				id: TID.now(),
				uid: uid,
				size: SpecificPaneSize.INHERIT,
				title: null,
				showReplies: 'follows',
				showReposts: true,
				showQuotes: true,
			},
			{
				type: PANE_TYPE_NOTIFICATIONS,
				id: TID.now(),
				uid: uid,
				size: SpecificPaneSize.INHERIT,
				title: null,
				mask: 0,
			},
			{
				type: PANE_TYPE_PROFILE,
				id: TID.now(),
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
