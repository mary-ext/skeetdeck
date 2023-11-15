import { getUniqueId } from '~/utils/misc.ts';

import Radio from '~/com/components/inputs/Radio.tsx';

import { type ProfilePaneConfig, ProfilePaneTab } from '../../../globals/panes.ts';

import { usePaneContext } from '../PaneContext.tsx';

const ProfilePaneTabSettings = () => {
	const { pane } = usePaneContext<ProfilePaneConfig>();

	const id = getUniqueId();

	return (
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
	);
};

export default ProfilePaneTabSettings;
