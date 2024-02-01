import { createSignal } from 'solid-js';

import { IconButton } from '~/com/primitives/icon-button.ts';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';
import HomePaneSettings from '../settings/HomePaneSettings.tsx';

const HomePane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	return (
		<>
			<Pane>
				<PaneHeader title="Subway Surfers">
					<button
						title="Column settings"
						onClick={() => setIsSettingsOpen(!isSettingsOpen())}
						class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
					>
						<SettingsIcon class="place-self-center" />
					</button>
				</PaneHeader>

				<PaneBody>
					<iframe
						width="560"
						height="315"
						src="https://www.youtube.com/embed/zZ7AimPACzc?autoplay=1&loop=1&controls=0"
						title="YouTube video player"
						frameborder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
						allowfullscreen
						class="h-full w-full"
					></iframe>
				</PaneBody>
			</Pane>

			{isSettingsOpen() && (
				<PaneAside onClose={() => setIsSettingsOpen(false)}>
					<HomePaneSettings />
					<GenericPaneSettings />
				</PaneAside>
			)}
		</>
	);
};

export default HomePane;
