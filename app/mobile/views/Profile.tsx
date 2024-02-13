import { type JSX, onMount, createSignal } from 'solid-js';

import { useParams } from '@pkg/solid-navigation';
import { createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';

import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';

import { formatCompact } from '~/utils/intl/number';

import CircularProgress from '~/com/components/CircularProgress';
import { TabbedPanel, TabbedPanelView } from '~/com/components/TabbedPanel';
import { VirtualContainer } from '~/com/components/VirtualContainer';

import ProfileHeader from '~/com/components/views/ProfileHeader';
import TimelineList from '~/com/components/lists/TimelineList';
import TimelineGalleryList from '~/com/components/lists/TimelineGalleryList';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';

import { Interactive } from '~/com/primitives/interactive';

import ViewHeader from '../components/ViewHeader';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import SearchIcon from '~/com/icons/baseline-search';

const enum ProfileTab {
	POSTS,
	POSTS_WITH_REPLIES,
	MEDIA,
	LIKES,
}

const iconBtn = Interactive({
	variant: 'white',
	class: `grid h-8 w-8 shrink-0 place-items-center rounded-full bg-black/50 text-lg text-white backdrop-blur disabled:opacity-50`,
});

const width = Math.min(window.innerWidth, 448);
const height = Math.floor((1 / 3) * width);

const paddedHeight = height + 16 + 36 + 12 + 28;

interface ProfileViewProps {
	me?: boolean;
}

const ProfileView = (props: ProfileViewProps) => {
	const me = props.me;

	const query = createQuery(() => {
		const uid = multiagent.active!;
		const actor = !me ? useParams<{ actor: DID }>().actor : uid;

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

			// @ts-expect-error
			const timeline = new ScrollTimeline({ source: document.documentElement });

			const headerRef = (node: HTMLElement) => {
				onMount(() => {
					node.animate(
						{ background: ['transparent', 'black'] },
						// @ts-expect-error
						{ timeline, rangeEnd: paddedHeight + 'px', fill: 'forwards' },
					);
				});
			};

			const titleWrapperRef = (node: HTMLElement) => {
				onMount(() => {
					node.animate([{ opacity: 0 }, { opacity: 0, offset: 0.8 }, { opacity: 1 }], {
						timeline,
						// @ts-expect-error
						rangeEnd: paddedHeight + 100 + 'px',
						fill: 'forwards',
					});
				});
			};

			return (
				<div class="contents">
					<div
						ref={headerRef}
						class="sticky top-0 z-30 -mt-13 flex h-13 min-w-0 shrink-0 items-center gap-2 px-4"
					>
						{!me ? (
							<button
								onClick={() => {
									if (navigation.canGoBack) {
										navigation.back();
									} else {
										navigation.navigate('/', { history: 'replace' });
									}
								}}
								class={`${iconBtn} -ml-2`}
							>
								<ArrowLeftIcon class="drop-shadow" />
							</button>
						) : null}

						<div ref={titleWrapperRef} class="flex min-w-0 grow flex-col gap-0.5 opacity-0">
							<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
								{profile.displayName.value}
							</p>

							<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
								{`${formatCompact(profile.postsCount.value)} posts`}
							</p>
						</div>

						<a href={/* @once */ `/${profile.did}/search`} class={iconBtn}>
							<SearchIcon class="drop-shadow" />
						</a>

						<button onClick={() => {}} class={`${iconBtn} -mr-2`}>
							<MoreHorizIcon class="rotate-90 drop-shadow" />
						</button>
					</div>

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
			<ViewHeader back={!me ? '/' : undefined} title="Profile" />,
			<div class="grid h-13 place-items-center">
				<CircularProgress />
			</div>,
		];
	}) as unknown as JSX.Element;
};

export default ProfileView;
