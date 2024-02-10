import type { DID } from '~/api/atp-schema';

export const PANE_TYPE_HOME = 'home';
export const PANE_TYPE_NOTIFICATIONS = 'notifications';
export const PANE_TYPE_PROFILE = 'profile';
export const PANE_TYPE_FEED = 'feed';
export const PANE_TYPE_LIST = 'list';
export const PANE_TYPE_SEARCH = 'search';
export const PANE_TYPE_THREAD = 'thread';

export type PaneType =
	| typeof PANE_TYPE_HOME
	| typeof PANE_TYPE_NOTIFICATIONS
	| typeof PANE_TYPE_PROFILE
	| typeof PANE_TYPE_FEED
	| typeof PANE_TYPE_LIST
	| typeof PANE_TYPE_SEARCH
	| typeof PANE_TYPE_THREAD;

export const labelizePaneType = (type: PaneType) => {
	switch (type) {
		case PANE_TYPE_HOME:
			return 'Home';
		case PANE_TYPE_NOTIFICATIONS:
			return 'Notifications';
		case PANE_TYPE_PROFILE:
			return 'Profile';
		case PANE_TYPE_FEED:
			return 'Feed';
		case PANE_TYPE_LIST:
			return 'User List';
		case PANE_TYPE_THREAD:
			return 'Thread';
		default:
			return 'N/A';
	}
};

export const enum PaneSize {
	SMALL = 'sm',
	MEDIUM = 'md',
	LARGE = 'lg',
}

export const enum SpecificPaneSize {
	INHERIT = 'inherit',
	SMALL = 'sm',
	MEDIUM = 'md',
	LARGE = 'lg',
}

export const enum ProfilePaneTab {
	POSTS = 'posts',
	POSTS_WITH_REPLIES = 'posts_with_replies',
	MEDIA = 'media',
	LIKES = 'likes',
}

export interface BasePaneConfig {
	readonly type: PaneType;
	readonly id: string;
	title: string | null;
	size: SpecificPaneSize;
	uid: DID;
}

export interface HomePaneConfig extends BasePaneConfig {
	readonly type: typeof PANE_TYPE_HOME;
	showReplies: 'follows' | boolean;
	showReposts: boolean;
	showQuotes: boolean;
}

export interface NotificationsPaneConfig extends BasePaneConfig {
	readonly type: typeof PANE_TYPE_NOTIFICATIONS;
	mask: number;
}

export interface ProfilePaneConfig extends BasePaneConfig {
	readonly type: typeof PANE_TYPE_PROFILE;
	profile: {
		did: DID;
		handle: string;
		// name?: string;
	};
	tab: ProfilePaneTab;
	tabVisible: boolean;
}

export interface CustomFeedPaneConfig extends BasePaneConfig {
	readonly type: typeof PANE_TYPE_FEED;
	feed: {
		uri: string;
		name: string;
	};
	showReplies: boolean;
	showReposts: boolean;
	showQuotes: boolean;
	infoVisible: boolean;
}

export interface CustomListPaneConfig extends BasePaneConfig {
	readonly type: typeof PANE_TYPE_LIST;
	list: {
		uri: string;
		name: string;
	};
	showReplies: boolean;
	showQuotes: boolean;
	infoVisible: boolean;
}

export interface SearchPaneConfig extends BasePaneConfig {
	readonly type: typeof PANE_TYPE_SEARCH;
	query: string;
}

export interface ThreadPaneConfig extends BasePaneConfig {
	readonly type: typeof PANE_TYPE_THREAD;
	thread: {
		actor: DID;
		rkey: string;
	};
}

export type PaneConfig =
	| HomePaneConfig
	| NotificationsPaneConfig
	| ProfilePaneConfig
	| CustomFeedPaneConfig
	| CustomListPaneConfig
	| SearchPaneConfig
	| ThreadPaneConfig;

export interface DeckConfig {
	readonly id: string;
	name: string;
	emoji: string;
	panes: PaneConfig[];
}
