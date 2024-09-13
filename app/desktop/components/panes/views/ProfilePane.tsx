import { type JSX, createSignal, lazy } from 'solid-js';

import { IconButton } from '~/com/primitives/icon-button';

import { TabbedPanel, TabbedPanelView } from '~/com/components/TabbedPanel';
import TimelineGalleryList from '~/com/components/lists/TimelineGalleryList';
import TimelineList from '~/com/components/lists/TimelineList';

import SettingsOutlinedIcon from '~/com/icons/outline-settings';

import { type ProfilePaneConfig, ProfilePaneTab } from '../../../globals/panes';
import { preferences } from '../../../globals/settings';
import Pane from '../Pane';
import PaneAside from '../PaneAside';
import PaneBody from '../PaneBody';
import { usePaneContext } from '../PaneContext';

const GenericPaneSettings = lazy(() => import('../settings/GenericPaneSettings'));
const ProfilePaneTabSettings = lazy(() => import('../settings/ProfilePaneTabSettings'));

const ProfilePane = () => {
	const [isSettingsOpen, setIsSettingsOpen] = createSignal(false);

	const { pane } = usePaneContext<ProfilePaneConfig>();

	const ui = preferences.ui;

	return [
		<Pane
			title={'@' + pane.profile.handle}
			subtitle="Profile"
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
