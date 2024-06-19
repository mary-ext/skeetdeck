import { onCleanup } from 'solid-js';

import CircularProgress from '~/com/components/CircularProgress';

import { onFocusPane } from '../../globals/events';
import { getPaneSizeWidth } from '../../globals/panes';
import { resolvePaneSize } from '../../globals/settings';

import { usePaneContext } from './PaneContext';

const PaneFallback = () => {
	const { pane } = usePaneContext();

	return (
		<div
			ref={(node) => {
				onCleanup(onFocusPane(pane, node));
			}}
			class="flex shrink-0 flex-col bg-background"
			style={{ width: getPaneSizeWidth(resolvePaneSize(pane.size)) + 'px' }}
		>
			<div class="grid grow place-items-center">
				<CircularProgress />
			</div>
		</div>
	);
};

export default PaneFallback;
