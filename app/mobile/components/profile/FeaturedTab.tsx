import { type JSX, createMemo, For } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import { getProfileFeeds, getProfileFeedsKey } from '~/api/queries/get-profile-feeds';
import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists';
import type { SignalizedProfile } from '~/api/stores/profiles';

import CircularProgress from '~/com/components/CircularProgress';
import { VirtualContainer } from '~/com/components/VirtualContainer';

import FeedItem from '~/com/components/items/FeedItem';
import ListItem from '~/com/components/items/ListItem';

export interface FeaturedTabProps {
	/** Expected to be static */
	profile: SignalizedProfile;
}

const FeaturedTab = (props: FeaturedTabProps) => {
	const profile = props.profile;
	const did = profile.did;
	const associated = profile.associated;

	const hasAssociated = createMemo(() => associated.value !== undefined);

	return (() => {
		if (!hasAssociated()) {
			return (
				<div class="grid h-13 place-items-center">
					<p class="text-sm text-muted-fg">Profile seems empty :(</p>
				</div>
			);
		}

		const hasFeeds = createMemo(() => associated.value!.feedgens > 0);
		// const hasLabeler = createMemo(() => associated.value!.labeler);
		const hasLists = createMemo(() => associated.value!.lists > 0);

		return [
			() => {
				if (!hasFeeds()) {
					return;
				}

				const MAX_ITEM_LIMIT = 4;

				const canShowMore = createMemo(() => {
					return associated.value!.feedgens > MAX_ITEM_LIMIT;
				});

				const feeds = createInfiniteQuery(() => {
					return {
						queryKey: getProfileFeedsKey(profile.uid, did),
						queryFn: getProfileFeeds,
						initialPageParam: undefined,
						getNextPageParam: (last) => last.cursor,
						select: (data) => {
							return data.pages[0].feeds.slice(0, MAX_ITEM_LIMIT);
						},
					};
				});

				return (
					<div class="border-b border-divider">
						<div class="-mb-2 flex h-13 items-center gap-2 px-4">
							<span class="font-bold">Feeds</span>
							<span class="text-muted-fg">{associated.value!.feedgens}</span>
						</div>

						<For each={feeds.data}>
							{(feed) => {
								return (
									<VirtualContainer estimateHeight={88}>
										<FeedItem feed={feed} />
									</VirtualContainer>
								);
							}}
						</For>

						{(() => {
							if (feeds.isLoading) {
								return (
									<div
										class="grid shrink-0 place-items-center"
										style={{ height: `${Math.min(associated.value!.lists, MAX_ITEM_LIMIT) * 88}px` }}
									>
										<CircularProgress />
									</div>
								);
							}

							if (canShowMore()) {
								return (
									<a
										href={`/profile/${did}/feeds`}
										class="flex h-13 items-center px-4 text-sm text-accent hover:bg-secondary/10"
									>
										Show more
									</a>
								);
							}
						})()}
					</div>
				);
			},
			() => {
				if (!hasLists()) {
					return;
				}

				const MAX_ITEM_LIMIT = 4;

				const canShowMore = createMemo(() => {
					return associated.value!.lists > MAX_ITEM_LIMIT;
				});

				const lists = createInfiniteQuery(() => {
					return {
						queryKey: getProfileListsKey(profile.uid, did),
						queryFn: getProfileLists,
						initialPageParam: undefined,
						getNextPageParam: (last) => last.cursor,
						select: (data) => {
							return data.pages[0].lists.slice(0, MAX_ITEM_LIMIT);
						},
					};
				});

				return (
					<div class="border-b border-divider">
						<div class="-mb-2 flex h-13 items-center gap-2 px-4">
							<span class="font-bold">Lists</span>
							<span class="text-muted-fg">{associated.value!.lists}</span>
						</div>

						<For each={lists.data}>
							{(list) => {
								return (
									<VirtualContainer estimateHeight={88}>
										<ListItem list={list} />
									</VirtualContainer>
								);
							}}
						</For>

						{(() => {
							if (lists.isLoading) {
								return (
									<div
										class="grid shrink-0 place-items-center"
										style={{ height: `${Math.min(associated.value!.lists, MAX_ITEM_LIMIT) * 88}px` }}
									>
										<CircularProgress />
									</div>
								);
							}

							if (canShowMore()) {
								return (
									<a
										href={`/profile/${did}/feeds`}
										class="flex h-13 items-center px-4 text-sm text-accent hover:bg-secondary/10"
									>
										Show more
									</a>
								);
							}
						})()}
					</div>
				);
			},
		];
	}) as unknown as JSX.Element;
};

export default FeaturedTab;
