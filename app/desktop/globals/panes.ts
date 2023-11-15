import type { DID } from '~/api/atp-schema.ts';

export enum PaneType {
	HOME = 'home',
	NOTIFICATIONS = 'notifications',
	PROFILE = 'profile',
	CUSTOM_FEED = 'custom_feed',
	CUSTOM_LIST = 'custom_list',
}

export const labelizePaneType = (type: PaneType) => {
	switch (type) {
		case PaneType.HOME:
			return 'Home';
		case PaneType.NOTIFICATIONS:
			return 'Notifications';
		case PaneType.PROFILE:
			return 'Profile';
		case PaneType.CUSTOM_FEED:
			return 'Feed';
		case PaneType.CUSTOM_LIST:
			return 'User List';
		default:
			return 'N/A';
	}
};

export enum PaneSize {
	SMALL = 'sm',
	MEDIUM = 'md',
	LARGE = 'lg',
}

export enum SpecificPaneSize {
	INHERIT = 'inherit',
	SMALL = 'sm',
	MEDIUM = 'md',
	LARGE = 'lg',
}

export enum ProfilePaneTab {
	POSTS = 'posts',
	POSTS_WITH_REPLIES = 'posts_with_replies',
	MEDIA = 'media',
	LIKES = 'likes',
}

export interface BasePaneConfig {
	readonly type: PaneType;
	readonly id: string;
	size: SpecificPaneSize;
	uid: DID;
}

export interface HomePaneConfig extends BasePaneConfig {
	readonly type: PaneType.HOME;
}

export interface NotificationsPaneConfig extends BasePaneConfig {
	readonly type: PaneType.NOTIFICATIONS;
}

export interface ProfilePaneConfig extends BasePaneConfig {
	readonly type: PaneType.PROFILE;
	profile: {
		did: DID;
		handle: string;
		// name?: string;
	};
	tab: ProfilePaneTab;
}

export interface CustomFeedPaneConfig extends BasePaneConfig {
	readonly type: PaneType.CUSTOM_FEED;
	feed: {
		uri: string;
		name: string;
	};
}

export interface CustomListPaneConfig extends BasePaneConfig {
	readonly type: PaneType.CUSTOM_LIST;
	list: {
		uri: string;
		name: string;
	};
}

export type PaneConfig =
	| HomePaneConfig
	| NotificationsPaneConfig
	| ProfilePaneConfig
	| CustomFeedPaneConfig
	| CustomListPaneConfig;

export interface DeckConfig {
	readonly id: string;
	name: string;
	emoji: string;
	panes: PaneConfig[];
}
