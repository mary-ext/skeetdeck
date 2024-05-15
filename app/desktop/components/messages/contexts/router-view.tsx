import { lazy, type Component } from 'solid-js';
import { ViewKind, type View } from './router';

export interface ChatRouterViewProps {
	view: View;
}

const views: Record<ViewKind, Component<any> | undefined> = {
	[ViewKind.CHANNEL_LISTING]: lazy(() => import('../views/ChannelListingView')),
	[ViewKind.CHANNEL]: lazy(() => import('../views/ChannelView')),
	[ViewKind.SETTINGS]: lazy(() => import('../views/SettingsView')),
};

export const ChatRouterView = ({ view }: ChatRouterViewProps) => {
	const Component = views[view.kind];

	if (Component) {
		return <Component {...view} />;
	}

	return null;
};
