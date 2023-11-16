import type { Component } from 'solid-js';

import { type PaneConfig, PaneType } from '../../globals/panes.ts';

import CustomFeedPane from './views/CustomFeedPane.tsx';
import CustomListPane from './views/CustomListPane.tsx';
import HomePane from './views/HomePane.tsx';
import ProfilePane from './views/ProfilePane.tsx';
import SearchPane from './views/SearchPane.tsx';

export interface PaneRouterProps {
	pane: PaneConfig;
}

// @ts-expect-error - simply because we don't have all of them implemented yet
const components: Record<PaneType, Component> = {
	[PaneType.CUSTOM_FEED]: CustomFeedPane,
	[PaneType.CUSTOM_LIST]: CustomListPane,
	[PaneType.HOME]: HomePane,
	[PaneType.PROFILE]: ProfilePane,
	[PaneType.SEARCH]: SearchPane,
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
