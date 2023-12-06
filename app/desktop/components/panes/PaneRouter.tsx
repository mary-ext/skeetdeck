import { type Component, lazy } from 'solid-js';

import {
	type PaneConfig,
	type PaneType,
	PANE_TYPE_FEED,
	PANE_TYPE_HOME,
	PANE_TYPE_LIST,
	PANE_TYPE_NOTIFICATIONS,
	PANE_TYPE_PROFILE,
	PANE_TYPE_SEARCH,
} from '../../globals/panes.ts';

export interface PaneRouterProps {
	pane: PaneConfig;
}

const components: Record<PaneType, Component> = {
	[PANE_TYPE_FEED]: lazy(() => import('./views/CustomFeedPane.tsx')),
	[PANE_TYPE_LIST]: lazy(() => import('./views/CustomListPane.tsx')),
	[PANE_TYPE_HOME]: lazy(() => import('./views/HomePane.tsx')),
	[PANE_TYPE_NOTIFICATIONS]: lazy(() => import('./views/NotificationsPane.tsx')),
	[PANE_TYPE_PROFILE]: lazy(() => import('./views/ProfilePane.tsx')),
	[PANE_TYPE_SEARCH]: lazy(() => import('./views/SearchPane.tsx')),
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
