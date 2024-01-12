import { type JSX, lazy } from 'solid-js';

import { getRecordId } from '~/api/utils/misc.ts';

import { updateFeedLike } from '~/api/mutations/like-feed.ts';
import type { SignalizedFeed } from '~/api/stores/feeds.ts';

import { formatCompact } from '~/utils/intl/number.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';

import { LINK_FEED_LIKED_BY, LINK_PROFILE, Link } from '~/com/components/Link.tsx';
import RichTextRenderer from '~/com/components/RichTextRenderer.tsx';

import FavoriteIcon from '~/com/icons/baseline-favorite.tsx';
import FavoriteOutlinedIcon from '~/com/icons/outline-favorite.tsx';

import DefaultFeedAvatar from '~/com/assets/default-feed-avatar.svg?url';
import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';

import FeedOverflowAction from './actions/FeedOverflowAction.tsx';

const LazyImageViewerDialog = lazy(() => import('~/com/components/dialogs/ImageViewerDialog.tsx'));

export interface FeedHeaderProps {
	feed?: SignalizedFeed;
}

const FeedHeader = (props: FeedHeaderProps) => {
	return (() => {
		const feed = props.feed;

		if (!feed) {
			return (
				<div class="p-4" style="height:172px">
					<div class="h-13 w-13 shrink-0 rounded-md bg-secondary/20"></div>
				</div>
			);
		}

		const creator = feed.creator;
		const isLiked = () => !!feed.viewer.like.value;

		return (
			<div class="flex flex-col gap-3 p-4">
				<div class="flex gap-4">
					{(() => {
						const avatar = feed.avatar.value;

						if (avatar) {
							return (
								<button
									onClick={() => {
										openModal(() => <LazyImageViewerDialog images={[{ fullsize: avatar }]} />);
									}}
									class="group h-13 w-13 shrink-0 overflow-hidden rounded-md bg-background"
								>
									<img src={avatar} class="h-full w-full object-cover group-hover:opacity-75" />
								</button>
							);
						}

						return <img src={DefaultFeedAvatar} class="h-13 w-13 shrink-0 rounded-md" />;
					})()}

					<div class="flex min-w-0 grow flex-col">
						<p class="break-words text-lg font-bold">{feed.name.value}</p>

						<Link
							to={/* @once */ { type: LINK_PROFILE, actor: creator.did }}
							class="group mt-1 flex items-center text-left"
						>
							<img src={creator.avatar.value || DefaultUserAvatar} class="mr-2 h-5 w-5 rounded-full" />
							<span class="mr-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold empty:hidden group-hover:underline">
								{creator.displayName.value}
							</span>
							<span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-fg">
								@{creator.handle.value}
							</span>
						</Link>
					</div>
				</div>

				<p class="whitespace-pre-wrap break-words text-sm empty:hidden">
					<RichTextRenderer
						item={feed}
						get={(item) => {
							return { t: item.description.value || '', f: item.descriptionFacets.value };
						}}
					/>
				</p>

				<Link
					to={{ type: LINK_FEED_LIKED_BY, actor: creator.did, rkey: getRecordId(feed.uri) }}
					class="text-left text-sm text-muted-fg hover:underline"
				>
					Liked by {formatCompact(feed.likeCount.value)} users
				</Link>

				<div class="flex gap-2">
					<button
						title={!isLiked() ? `Like this feed` : `Unlike this feed`}
						onClick={() => {
							updateFeedLike(feed, !isLiked());
						}}
						class={/* @once */ Button({ variant: 'outline' })}
					>
						{isLiked() ? (
							<FavoriteIcon class="-mx-1.5 text-base text-red-500" />
						) : (
							<FavoriteOutlinedIcon class="-mx-1.5 text-base" />
						)}
					</button>

					<div class="grow"></div>

					<FeedOverflowAction feed={feed}>
						<button title="Actions" class={/* @once */ Button({ variant: 'outline' })}>
							<MoreHorizIcon class="-mx-1.5 text-base" />
						</button>
					</FeedOverflowAction>
				</div>
			</div>
		);
	}) as unknown as JSX.Element;
};

export default FeedHeader;
