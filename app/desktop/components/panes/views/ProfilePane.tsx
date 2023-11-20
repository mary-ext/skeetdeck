import { createSignal } from 'solid-js';

import { ProfilePaneTab, type ProfilePaneConfig } from '../../../globals/panes.ts';

import TimelineList from '~/com/components/lists/TimelineList.tsx';
import { TabbedPanel, TabbedPanelView } from '~/com/components/TabbedPanel.tsx';

import { IconButton } from '~/com/primitives/icon-button.ts';

import SettingsIcon from '~/com/icons/baseline-settings.tsx';

import { usePaneContext } from '../PaneContext.tsx';
import Pane from '../Pane.tsx';
import PaneAside from '../PaneAside.tsx';
import PaneBody from '../PaneBody.tsx';
import PaneHeader from '../PaneHeader.tsx';

import GenericPaneSettings from '../settings/GenericPaneSettings.tsx';
import ProfilePaneTabSettings from '../settings/ProfilePaneTabSettings.tsx';

const ProfilePane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<ProfilePaneConfig>();

	return (
		<>
			<Pane>
				<PaneHeader title={'@' + pane.profile.handle} subtitle="Profile">
					<button
						title="Column settings"
						onClick={() => setIsSettingsOpen(!isSettingsOpen())}
						class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}
					>
						<SettingsIcon class="place-self-center" />
					</button>
				</PaneHeader>

				<PaneBody>
					<TabbedPanel
						selected={pane.tab}
						onChange={(next) => (pane.tab = next)}
						dense
						hideTabs={!pane.tabVisible}
					>
						<TabbedPanelView label="Posts" value={ProfilePaneTab.POSTS}>
							<TimelineList
								uid={pane.uid}
								params={{ type: 'profile', actor: pane.profile.did, tab: 'posts' }}
							/>
						</TabbedPanelView>
						<TabbedPanelView label="Replies" value={ProfilePaneTab.POSTS_WITH_REPLIES}>
							<TimelineList
								uid={pane.uid}
								params={{ type: 'profile', actor: pane.profile.did, tab: 'replies' }}
							/>
						</TabbedPanelView>
						<TabbedPanelView label="Media" value={ProfilePaneTab.MEDIA}>
							<TimelineList
								uid={pane.uid}
								params={{ type: 'profile', actor: pane.profile.did, tab: 'media' }}
							/>
						</TabbedPanelView>
						<TabbedPanelView
							label="Likes"
							value={ProfilePaneTab.LIKES}
							hidden={pane.uid !== pane.profile.did}
						>
							<TimelineList
								uid={pane.uid}
								params={{ type: 'profile', actor: pane.profile.did, tab: 'likes' }}
							/>
						</TabbedPanelView>
					</TabbedPanel>
				</PaneBody>
			</Pane>

			{isSettingsOpen() && (
				<PaneAside onClose={() => setIsSettingsOpen(false)}>
					<ProfilePaneTabSettings />
					<GenericPaneSettings />
				</PaneAside>
			)}
		</>
	);
};

export default ProfilePane;
