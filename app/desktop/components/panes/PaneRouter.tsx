import { type Component, lazy } from 'solid-js';

import { type PaneConfig, PaneType } from '../../globals/panes.ts';

export interface PaneRouterProps {
	pane: PaneConfig;
}

const components: Record<PaneType, Component> = {
	[PaneType.FEED]: lazy(() => import('./views/CustomFeedPane.tsx')),
	[PaneType.LIST]: lazy(() => import('./views/CustomListPane.tsx')),
	[PaneType.HOME]: lazy(() => import('./views/HomePane.tsx')),
	[PaneType.NOTIFICATIONS]: lazy(() => import('./views/NotificationsPane.tsx')),
	[PaneType.PROFILE]: lazy(() => import('./views/ProfilePane.tsx')),
	[PaneType.SEARCH]: lazy(() => import('./views/SearchPane.tsx')),
};

const PaneRouter = (props: PaneRouterProps) => {
	const pane = props.pane;

	const Component = components[pane.type];

	if (Component) {
		return <Component />;
	}

	return null;
};

export default PaneRouter;
