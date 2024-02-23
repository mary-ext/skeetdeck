import { type JSX, createSignal } from 'solid-js';

import { useParams } from '@pkg/solid-navigation';
import { createQuery } from '@pkg/solid-query';

import type { At } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';

import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';

import { formatCompact } from '~/utils/intl/number';

import CircularProgress from '~/com/components/CircularProgress';
import { TabbedPanel, TabbedPanelView } from '~/com/components/TabbedPanel';
import { VirtualContainer } from '~/com/components/VirtualContainer';

import ProfileHeader from '~/com/components/views/ProfileHeader';
import TimelineList from '~/com/components/lists/TimelineList';
import TimelineGalleryList from '~/com/components/lists/TimelineGalleryList';

import { IconButton } from '~/com/primitives/icon-button';

import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import SearchIcon from '~/com/icons/baseline-search';

import ViewHeader from '../components/ViewHeader';

const enum ProfileTab {
	POSTS,
	POSTS_WITH_REPLIES,
	MEDIA,
	LIKES,
}

const ProfileView = () => {
	const { actor } = useParams<{ actor: At.DID }>();

	const query = createQuery(() => {
		const uid = multiagent.active!;
		const key = getProfileKey(uid, actor);

		return {
			queryKey: key,
			queryFn: getProfile,
			initialData: () => getInitialProfile(key),
			initialDataUpdatedAt: 0,
		};
	});

	return (() => {
		const profile = query.data;
		if (profile) {
			const [tab, setTab] = createSignal(ProfileTab.POSTS);

			return (
				<div class="contents">
					<ViewHeader
						back="/home"
						title={profile.displayName.value || `@${profile.handle.value}`}
						subtitle={`${formatCompact(profile.postsCount.value)} posts`}
					>
						<a
							title="Search this user's posts"
							href={/* @once */ `/${profile.did}/search`}
							class={/* @once */ IconButton()}
						>
							<SearchIcon />
						</a>

						<button title="More actions" class={/* @once */ IconButton({ edge: 'right' })}>
							<MoreHorizIcon />
						</button>
					</ViewHeader>

					<VirtualContainer class="shrink-0">
						<ProfileHeader profile={profile} />
					</VirtualContainer>

					<TabbedPanel selected={tab()} onChange={setTab}>
						<TabbedPanelView label="Posts" value={ProfileTab.POSTS}>
							<TimelineList
								uid={/* @once */ profile.uid}
								params={/* @once */ { type: 'profile', actor: profile.did, tab: 'posts' }}
							/>
						</TabbedPanelView>
						<TabbedPanelView label="Replies" value={ProfileTab.POSTS_WITH_REPLIES}>
							<TimelineList
								uid={/* @once */ profile.uid}
								params={/* @once */ { type: 'profile', actor: profile.did, tab: 'replies' }}
							/>
						</TabbedPanelView>
						<TabbedPanelView label="Media" value={ProfileTab.MEDIA}>
							<TimelineGalleryList
								uid={/* @once */ profile.uid}
								params={/* @once */ { type: 'profile', actor: profile.did, tab: 'media' }}
							/>
						</TabbedPanelView>
						<TabbedPanelView
							label="Likes"
							value={ProfileTab.LIKES}
							hidden={/* @once */ profile.uid !== profile.did}
						>
							<TimelineList
								uid={/* @once */ profile.uid}
								params={/* @once */ { type: 'profile', actor: profile.did, tab: 'likes' }}
							/>
						</TabbedPanelView>
					</TabbedPanel>
				</div>
			);
		}

		return [
			<ViewHeader back="/home" title="Profile" />,
			<div class="grid h-13 place-items-center">
				<CircularProgress />
			</div>,
		];
	}) as unknown as JSX.Element;
};

export default ProfileView;
