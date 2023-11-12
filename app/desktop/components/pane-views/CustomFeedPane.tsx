import type { CustomFeedPaneConfig } from '~/desktop/globals/panes.ts';

import iconButton from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import Pane from '~/desktop/components/panes/Pane.tsx';
import PaneBody from '~/desktop/components/panes/PaneBody.tsx';
import PaneHeader from '~/desktop/components/panes/PaneHeader.tsx';

export interface CustomFeedPaneProps {
	/** Expected to be static */
	pane: CustomFeedPaneConfig;
}

const CustomFeedPane = (props: CustomFeedPaneProps) => {
	const pane = props.pane;

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
