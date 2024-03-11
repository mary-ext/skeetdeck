import { type JSX, createSignal, createMemo, Suspense, lazy } from 'solid-js';

import { useParams } from '@pkg/solid-navigation';
import { createQuery } from '@pkg/solid-query';

import type { At } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';

import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';
import type { SignalizedProfile } from '~/api/stores/profiles';

import { formatCompact } from '~/utils/intl/number';

import FilterBar from '~/com/components/inputs/FilterBar';
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

import ProfileOverflowAction from '~/com/components/views/profiles/ProfileOverflowAction';

const FeaturedTab = lazy(() => import('../components/profile/FeaturedTab'));

const enum NewProfileTab {
	FEATURED,
	TIMELINE,
}

const enum TimelineFilter {
	POSTS,
	REPLIES,
	MEDIA,
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

	// <TabbedPanel selected={tab()} onChange={setTab}>
	// 	<TabbedPanelView label="Posts" value={ProfileTab.POSTS}>
	// 		<TimelineList
	// 			uid={/* @once */ profile.uid}
	// 			params={/* @once */ { type: 'profile', actor: profile.did, tab: 'posts' }}
	// 		/>
	// 	</TabbedPanelView>
	// 	<TabbedPanelView label="Replies" value={ProfileTab.POSTS_WITH_REPLIES}>
	// 		<TimelineList
	// 			uid={/* @once */ profile.uid}
	// 			params={/* @once */ { type: 'profile', actor: profile.did, tab: 'replies' }}
	// 		/>
	// 	</TabbedPanelView>
	// 	<TabbedPanelView label="Media" value={ProfileTab.MEDIA}>
	// 		<TimelineGalleryList
	// 			uid={/* @once */ profile.uid}
	// 			params={/* @once */ { type: 'profile', actor: profile.did, tab: 'media' }}
	// 		/>
	// 	</TabbedPanelView>
	// 	<TabbedPanelView label="Likes" value={ProfileTab.LIKES} hidden={/* @once */ profile.uid !== profile.did}>
	// 		<TimelineList
	// 			uid={/* @once */ profile.uid}
	// 			params={/* @once */ { type: 'profile', actor: profile.did, tab: 'likes' }}
	// 		/>
	// 	</TabbedPanelView>
	// </TabbedPanel>;

	return (() => {
		const profile = query.data;
		if (profile) {
			const [tab, setTab] = createSignal(NewProfileTab.TIMELINE);

			return (
				<div class="contents">
					<ViewHeader
						back="/home"
						title={profile.displayName.value || `@${profile.handle.value}`}
						subtitle={`${formatCompact(profile.postsCount.value)} posts`}
						borderless={!!profile.associated.value}
					>
						<a
							title="Search this user's posts"
							href={/* @once */ `/${profile.did}/search`}
							class={/* @once */ IconButton()}
						>
							<SearchIcon />
						</a>

						<ProfileOverflowAction profile={profile}>
							<button title="More actions" class={/* @once */ IconButton({ edge: 'right' })}>
								<MoreHorizIcon />
							</button>
						</ProfileOverflowAction>
					</ViewHeader>

					<VirtualContainer class="shrink-0">
						<ProfileHeader profile={profile} />
					</VirtualContainer>

					<TabbedPanel selected={tab()} onChange={setTab} hideTabs={!profile.associated.value}>
						<TabbedPanelView label="Featured" value={NewProfileTab.FEATURED}>
							<Suspense
								fallback={
									<div class="grid h-13 place-items-center">
										<CircularProgress />
									</div>
								}
							>
								<FeaturedTab profile={profile} />
							</Suspense>
						</TabbedPanelView>
						<TabbedPanelView label="Timeline" value={NewProfileTab.TIMELINE}>
							<TimelineView profile={profile} />
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

const TimelineView = (props: { profile: SignalizedProfile }) => {
	const profile = props.profile;
	const [filter, setFilter] = createSignal(TimelineFilter.POSTS);

	return (
		<>
			<div class="p-4">
				<FilterBar
					value={filter()}
					onChange={setFilter}
					items={[
						{ value: TimelineFilter.POSTS, label: 'Posts' },
						{ value: TimelineFilter.REPLIES, label: 'Posts and replies' },
						{ value: TimelineFilter.MEDIA, label: 'Media' },
					]}
				/>
			</div>

			{(() => {
				const $filter = filter();

				if ($filter === TimelineFilter.POSTS) {
					return (
						<TimelineList
							uid={/* @once */ profile.uid}
							params={/* @once */ { type: 'profile', actor: profile.did, tab: 'posts' }}
						/>
					);
				}

				if ($filter === TimelineFilter.REPLIES) {
					return (
						<TimelineList
							uid={/* @once */ profile.uid}
							params={/* @once */ { type: 'profile', actor: profile.did, tab: 'replies' }}
						/>
					);
				}

				if ($filter === TimelineFilter.MEDIA) {
					return (
						<TimelineGalleryList
							uid={/* @once */ profile.uid}
							params={/* @once */ { type: 'profile', actor: profile.did, tab: 'media' }}
						/>
					);
				}
			})()}
		</>
	);
};
