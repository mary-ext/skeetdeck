import { createSignal } from 'solid-js';

import type { CustomListPaneConfig } from '../../../globals/panes.ts';

import iconButton from '~/com/primitives/icon-button.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import DeletePaneSettings from '../settings/DeletePaneSettings.tsx';
import PaneSizeSettings from '../settings/PaneSizeSettings.tsx';

const CustomListPane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<CustomListPaneConfig>();

	return (
		<>
			<Pane>
				<PaneHeader title={pane.list.name} subtitle="User list">
					<button
						onClick={() => setIsSettingsOpen(!isSettingsOpen())}
						class={/* @once */ iconButton({ edge: 'right', color: 'muted' })}
					>
						<SettingsIcon class="place-self-center" />
					</button>
				</PaneHeader>

				<PaneBody>
					<TimelineList uid={pane.uid} params={{ type: 'list', uri: pane.list.uri }} />
				</PaneBody>
			</Pane>

			{isSettingsOpen() && (
				<PaneAside onClose={() => setIsSettingsOpen(false)}>
					<PaneSizeSettings />
					<DeletePaneSettings />
				</PaneAside>
			)}
		</>
	);
};

export default CustomListPane;
