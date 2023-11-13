import { type PaneConfig, PaneType } from '~/desktop/globals/panes.ts';

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
			return <HomePane pane={pane} />;
		case PaneType.CUSTOM_FEED:
			return <CustomFeedPane pane={pane} />;
		case PaneType.CUSTOM_LIST:
			return <CustomListPane pane={pane} />;
	}

	return null;
};

export default PaneRouter;
