import { type Component, lazy } from 'solid-js';

import {
	PANE_TYPE_FEED,
	PANE_TYPE_HOME,
	PANE_TYPE_LIST,
	PANE_TYPE_NOTIFICATIONS,
	PANE_TYPE_PROFILE,
	PANE_TYPE_SEARCH,
	PANE_TYPE_THREAD,
	type PaneConfig,
	type PaneType,
} from '../../globals/panes';

export interface PaneRouterProps {
	pane: PaneConfig;
}

const components: Record<PaneType, Component> = {
	[PANE_TYPE_FEED]: lazy(() => import('./views/CustomFeedPane')),
	[PANE_TYPE_LIST]: lazy(() => import('./views/CustomListPane')),
	[PANE_TYPE_HOME]: lazy(() => import('./views/HomePane')),
	[PANE_TYPE_NOTIFICATIONS]: lazy(() => import('./views/NotificationsPane')),
	[PANE_TYPE_PROFILE]: lazy(() => import('./views/ProfilePane')),
	[PANE_TYPE_SEARCH]: lazy(() => import('./views/SearchPane')),
	[PANE_TYPE_THREAD]: lazy(() => import('./views/ThreadPane')),
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
