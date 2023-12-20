import type { JSX } from 'solid-js';

import { getRecordId } from '~/api/utils/misc.ts';

import type { SignalizedFeed } from '~/api/stores/feeds.ts';

import { Interactive } from '../../primitives/interactive.ts';

import { LINK_FEED, Link } from '../Link.tsx';

import DefaultFeedAvatar from '../../assets/default-feed-avatar.svg?url';

export interface FeedItemProps {
	feed: SignalizedFeed;
}

const feedItemInteractive = Interactive({ variant: 'muted', class: 'w-full' });

const FeedItemContent = (props: FeedItemProps, interactive?: boolean) => {
	return (() => {
		const feed = props.feed;

		return (
			<div class="flex gap-3 px-4 py-3 text-left" classList={{ [`hover:bg-secondary/10`]: interactive }}>
				<img src={feed.avatar.value || DefaultFeedAvatar} class="h-12 w-12 shrink-0 rounded-md" />

				<div class="flex min-w-0 grow flex-col gap-1">
					<div class="my-auto min-w-0 text-sm">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold">{feed.name.value}</p>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
							{`Feed by @${feed.creator.handle.value}`}
						</p>
					</div>

					<div class="line-clamp-3 break-words text-sm empty:hidden">{feed.description.value}</div>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const FeedItem = (props: FeedItemProps) => {
	return (() => {
		const feed = props.feed;

		return (
			<Link
				to={{ type: LINK_FEED, actor: feed.creator.did, rkey: getRecordId(feed.uri) }}
				class={feedItemInteractive}
			>
				{/* @once */ FeedItemContent(props, true)}
			</Link>
		);
	}) as unknown as JSX.Element;
};

export default FeedItem;
