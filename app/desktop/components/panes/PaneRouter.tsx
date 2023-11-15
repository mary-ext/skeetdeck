import { type PaneConfig, PaneType } from '../../globals/panes.ts';

import CustomFeedPane from './views/CustomFeedPane.tsx';
import CustomListPane from './views/CustomListPane.tsx';
import HomePane from './views/HomePane.tsx';

export interface PaneRouterProps {
	pane: PaneConfig;
}

const PaneRouter = (props: PaneRouterProps) => {
	const pane = props.pane;

	switch (pane.type) {
		case PaneType.HOME:
			return <HomePane />;
		case PaneType.CUSTOM_FEED:
			return <CustomFeedPane />;
		case PaneType.CUSTOM_LIST:
			return <CustomListPane />;
	}

	return null;
};

export default PaneRouter;
