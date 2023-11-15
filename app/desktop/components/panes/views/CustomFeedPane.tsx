import type { CustomFeedPaneConfig } from '../../../globals/panes.ts';

import iconButton from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

const CustomFeedPane = () => {
	const { pane } = usePaneContext<CustomFeedPaneConfig>();

	return (
		<Pane>
			<PaneHeader title={pane.feed.name} subtitle="Feed">
				<button class={/* @once */ iconButton({ edge: 'right', color: 'muted' })}>
					<SettingsIcon class="place-self-center" />
				</button>
			</PaneHeader>

			<PaneBody>
				<TimelineList uid={pane.uid} params={{ type: 'feed', uri: pane.feed.uri }} />
			</PaneBody>
		</Pane>
	);
};

export default CustomFeedPane;
