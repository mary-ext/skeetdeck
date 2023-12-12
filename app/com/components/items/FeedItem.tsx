import type { JSX } from 'solid-js';

import { getRecordId } from '~/api/utils/misc.ts';

import type { SignalizedFeed } from '~/api/stores/feeds.ts';

import { LINK_FEED, Link } from '../Link.tsx';

import DefaultFeedAvatar from '../../assets/default-feed-avatar.svg?url';

export interface FeedItemProps {
	feed: SignalizedFeed;
}

const FeedItemContent = (props: FeedItemProps, interactive?: boolean) => {
	return (() => {
		const feed = props.feed;

		return (
			<div
				class="flex w-full cursor-pointer flex-col gap-3 px-4 py-3 text-left text-sm hover:bg-secondary/10"
				classList={{ [`hover:bg-secondary/10`]: interactive }}
			>
				<div class="flex gap-4">
					<img src={feed.avatar.value || DefaultFeedAvatar} class="mt-0.5 h-9 w-9 shrink rounded-md" />

					<div class="min-w-0 grow">
						<p class="overflow-hidden text-ellipsis font-bold">{feed.name.value}</p>
						<p class="text-muted-fg">{`by ${feed.creator.handle.value}`}</p>
					</div>
				</div>

				<div class="max-w-full whitespace-pre-wrap break-words text-sm empty:hidden">
					{feed.description.value}
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const FeedItem = (props: FeedItemProps) => {
	return (() => {
		const feed = props.feed;

		return (
			<Link to={{ type: LINK_FEED, actor: feed.creator.did, rkey: getRecordId(feed.uri) }} class="contents">
				{/* @once */ FeedItemContent(props)}
			</Link>
		);
	}) as unknown as JSX.Element;
};

export default FeedItem;
