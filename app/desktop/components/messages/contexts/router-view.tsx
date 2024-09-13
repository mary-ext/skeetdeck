import { type Component, lazy } from 'solid-js';

import { type View, ViewKind } from './router';

export interface ChatRouterViewProps {
	view: View;
}

const views: Record<ViewKind, Component<any> | undefined> = {
	[ViewKind.CHANNEL_LISTING]: lazy(() => import('../views/ChannelListingView')),
	[ViewKind.CHANNEL]: lazy(() => import('../views/ChannelView')),
	[ViewKind.NEW_CHANNEL]: lazy(() => import('../views/NewChannelView')),
	[ViewKind.RESOLVE_CHANNEL]: lazy(() => import('../views/ResolveChannelView')),
	[ViewKind.SETTINGS]: lazy(() => import('../views/SettingsView')),
};

export const ChatRouterView = ({ view }: ChatRouterViewProps) => {
	const Component = views[view.kind];

	if (Component) {
		return <Component {...view} />;
	}

	return null;
};
