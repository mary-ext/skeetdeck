import { type JSX, createSignal, lazy } from 'solid-js';

import { IconButton } from '~/com/primitives/icon-button';

import TimelineList from '~/com/components/lists/TimelineList';

import SettingsOutlinedIcon from '~/com/icons/outline-settings';

import type { HomePaneConfig } from '../../../globals/panes';
import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';
import { usePaneContext } from '../PaneContext';

const GenericPaneSettings = lazy(() => import('../settings/GenericPaneSettings'));
const HomePaneSettings = lazy(() => import('../settings/HomePaneSettings'));

const HomePane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<HomePaneConfig>();

	return [
		<Pane
			title="Home"
			actions={
				<>
					<button
						title="Column settings"
						onClick={() => setIsSettingsOpen(!isSettingsOpen())}
						class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
					>
						<SettingsOutlinedIcon />
					</button>
				</>
			}
		>
			<PaneBody>
				<TimelineList
					uid={pane.uid}
					params={{
						type: 'home',
						algorithm: 'reverse-chronological',
						showReplies: pane.showReplies,
						showReposts: pane.showReposts,
						showQuotes: pane.showQuotes,
					}}
				/>
			</PaneBody>
		</Pane>,
		() => {
			if (isSettingsOpen()) {
				return (
					<PaneAside onClose={() => setIsSettingsOpen(false)}>
						<HomePaneSettings />
						<GenericPaneSettings />
					</PaneAside>
				);
			}
		},
	] as unknown as JSX.Element;
};

export default HomePane;
