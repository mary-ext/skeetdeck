import type { CustomListPaneConfig } from '~/desktop/globals/panes.ts';

import iconButton from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '~/desktop/components/panes/Pane.tsx';
import PaneBody from '~/desktop/components/panes/PaneBody.tsx';
import PaneHeader from '~/desktop/components/panes/PaneHeader.tsx';

const CustomListPane = () => {
	const { pane } = usePaneContext<CustomListPaneConfig>();

	return (
		<Pane>
			<PaneHeader title={pane.list.name} subtitle="User list">
				<button class={/* @once */ iconButton({ edge: 'right', color: 'muted' })}>
					<SettingsIcon class="place-self-center" />
				</button>
			</PaneHeader>

			<PaneBody>
				<TimelineList uid={pane.uid} params={{ type: 'list', uri: pane.list.uri }} />
			</PaneBody>
		</Pane>
	);
};

export default CustomListPane;
