import { type JSX, createSignal } from 'solid-js';

import { preferences } from '../../../globals/settings';
import { ProfilePaneTab, type ProfilePaneConfig } from '../../../globals/panes';

import TimelineList from '~/com/components/lists/TimelineList';
import TimelineGalleryList from '~/com/components/lists/TimelineGalleryList';
import { TabbedPanel, TabbedPanelView } from '~/com/components/TabbedPanel';

import { IconButton } from '~/com/primitives/icon-button';

import SettingsIcon from '~/com/icons/baseline-settings';

import { usePaneContext } from '../PaneContext';
import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';
import PaneHeader from '../PaneHeader';

import GenericPaneSettings from '../settings/GenericPaneSettings';
import ProfilePaneTabSettings from '../settings/ProfilePaneTabSettings';

const ProfilePane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<ProfilePaneConfig>();

	const ui = preferences.ui;

	return [
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
						{ui.profileMediaGrid ? (
							<TimelineGalleryList
								uid={pane.uid}
								params={{ type: 'profile', actor: pane.profile.did, tab: 'media' }}
							/>
						) : (
							<TimelineList
								uid={pane.uid}
								params={{ type: 'profile', actor: pane.profile.did, tab: 'media' }}
							/>
						)}
					</TabbedPanelView>
					<TabbedPanelView label="Likes" value={ProfilePaneTab.LIKES} hidden={pane.uid !== pane.profile.did}>
						<TimelineList
							uid={pane.uid}
							params={{ type: 'profile', actor: pane.profile.did, tab: 'likes' }}
						/>
					</TabbedPanelView>
				</TabbedPanel>
			</PaneBody>
		</Pane>,

		() => {
			if (isSettingsOpen()) {
				return (
					<PaneAside onClose={() => setIsSettingsOpen(false)}>
						<ProfilePaneTabSettings />
						<GenericPaneSettings />
					</PaneAside>
				);
			}
		},
	] as unknown as JSX.Element;
};

export default ProfilePane;
