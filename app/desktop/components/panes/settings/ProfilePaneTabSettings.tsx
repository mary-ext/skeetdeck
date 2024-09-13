import { getUniqueId } from '~/utils/misc';

import Checkbox from '~/com/components/inputs/Checkbox';
import Radio from '~/com/components/inputs/Radio';

import { type ProfilePaneConfig, ProfilePaneTab } from '../../../globals/panes';
import { usePaneContext } from '../PaneContext';

const ProfilePaneTabSettings = () => {
	const { pane } = usePaneContext<ProfilePaneConfig>();

	const id = getUniqueId();

	return (
		<div class="contents">
			<label class="flex items-center justify-between gap-4 border-b border-divider p-4">
				<span class="text-sm">Show tabs</span>
				<Checkbox checked={pane.tabVisible} onChange={(next) => (pane.tabVisible = next.target.checked)} />
			</label>

			<div class="flex flex-col border-b border-divider pb-5">
				<p class="p-4 text-sm font-bold">Filter</p>

				<div class="mx-4 flex flex-col gap-2 text-sm">
					<label class="flex items-center justify-between gap-2">
						<span>Posts</span>
						<Radio
							name={id}
							checked={pane.tab === ProfilePaneTab.POSTS}
							onChange={() => (pane.tab = ProfilePaneTab.POSTS)}
						/>
					</label>

					<label class="flex items-center justify-between gap-2">
						<span>Posts with replies</span>
						<Radio
							name={id}
							checked={pane.tab === ProfilePaneTab.POSTS_WITH_REPLIES}
							onChange={() => (pane.tab = ProfilePaneTab.POSTS_WITH_REPLIES)}
						/>
					</label>

					<label class="flex items-center justify-between gap-2">
						<span>Media</span>
						<Radio
							name={id}
							checked={pane.tab === ProfilePaneTab.MEDIA}
							onChange={() => (pane.tab = ProfilePaneTab.MEDIA)}
						/>
					</label>

					{pane.uid === pane.profile.did && (
						<label class="flex items-center justify-between gap-2">
							<span>Likes</span>
							<Radio
								name={id}
								checked={pane.tab === ProfilePaneTab.LIKES}
								onChange={() => (pane.tab = ProfilePaneTab.LIKES)}
							/>
						</label>
					)}
				</div>
			</div>
		</div>
	);
};

export default ProfilePaneTabSettings;
