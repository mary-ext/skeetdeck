import type { JSX } from 'solid-js';

import type { RefOf } from '~/api/atp-schema.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { Interactive } from '../../primitives/interactive.ts';

import { LINK_FEED, Link } from '../Link.tsx';

import DefaultFeedAvatar from '../../assets/default-feed-avatar.svg?url';

export interface FeedItemProps {
	feed: RefOf<'app.bsky.feed.defs#generatorView'>;
}

const feedItemInteractive = Interactive({ variant: 'muted', class: 'w-full' });

const FeedItemContent = (props: FeedItemProps) => {
	// nothing is interactive here, and this isn't something that changes often,
	// so let's put it under one single render effect.
	return (() => {
		const feed = props.feed;

		return (
			<div class="flex gap-3 px-4 py-3 text-left">
				<img src={/* @once */ feed.avatar || DefaultFeedAvatar} class="h-12 w-12 shrink-0 rounded-md" />

				<div class="flex min-w-0 grow flex-col gap-1">
					<div class="my-auto min-w-0 text-sm">
						<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold">
							{/* @once */ feed.displayName}
						</p>
						<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
							{/* @once */ `Feed by @${feed.creator.handle}`}
						</p>
					</div>

					<div class="line-clamp-3 break-words text-sm empty:hidden">{/* @once */ feed.description}</div>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

const FeedItem = (props: FeedItemProps) => {
	// we don't want the user to suddenly lose focus on this link
	const feed = () => props.feed;

	return (
		<Link
			to={{ type: LINK_FEED, actor: feed().creator.did, rkey: getRecordId(feed().uri) }}
			class={feedItemInteractive}
		>
			{/* @once */ FeedItemContent(props)}
		</Link>
	);
};

export default FeedItem;
