import { createSignal } from 'solid-js';

import type { CustomFeedPaneConfig } from '../../../globals/panes.ts';

import { IconButton } from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import DeletePaneSettings from '../settings/DeletePaneSettings.tsx';
import PaneSizeSettings from '../settings/PaneSizeSettings.tsx';

const CustomFeedPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<CustomFeedPaneConfig>();

	return (
		<>
			<Pane>
				<PaneHeader title={pane.feed.name} subtitle="Feed">
					<button
						onClick={() => setIsSettingsOpen(!isSettingsOpen())}
						class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
					>
						<SettingsIcon class="place-self-center" />
					</button>
				</PaneHeader>

				<PaneBody>
					<TimelineList uid={pane.uid} params={{ type: 'feed', uri: pane.feed.uri }} />
				</PaneBody>
			</Pane>

			{isSettingsOpen() && (
				<PaneAside>
					<PaneSizeSettings />
					<DeletePaneSettings />
				</PaneAside>
			)}
		</>
	);
};

export default CustomFeedPane;
