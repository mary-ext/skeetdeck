import type { HomePaneConfig } from '~/desktop/globals/panes.ts';

import iconButton from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import Pane from '~/desktop/components/panes/Pane.tsx';
import PaneBody from '~/desktop/components/panes/PaneBody.tsx';
import PaneHeader from '~/desktop/components/panes/PaneHeader.tsx';

export interface HomePaneProps {
	/** Expected to be static */
	pane: HomePaneConfig;
}

const HomePane = (props: HomePaneProps) => {
	const pane = props.pane;

	return (
		<Pane>
			<PaneHeader title="Home">
				<button class={/* @once */ iconButton({ edge: 'right', color: 'muted' })}>
					<SettingsIcon class="place-self-center" />
				</button>
			</PaneHeader>

			<PaneBody>
				<TimelineList uid={pane.uid} params={{ type: 'home', algorithm: 'reverse-chronological' }} />
			</PaneBody>
		</Pane>
	);
};

export default HomePane;
