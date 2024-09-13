import { type JSX, lazy } from 'solid-js';

import { updateFeedLike } from '~/api/mutations/like-feed';
import type { SignalizedFeed } from '~/api/stores/feeds';
import { getRecordId } from '~/api/utils/misc';

import { openModal } from '~/com/globals/modals';

import { formatCompact } from '~/utils/intl/number';

import { BoxedIconButton } from '~/com/primitives/boxed-icon-button';

import { LINK_FEED_LIKED_BY, LINK_PROFILE, Link } from '~/com/components/Link';
import RichTextRenderer from '~/com/components/RichTextRenderer';
import { VirtualContainer } from '~/com/components/VirtualContainer';

import FavoriteIcon from '~/com/icons/baseline-favorite';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';
import FavoriteOutlinedIcon from '~/com/icons/outline-favorite';

import DefaultFeedAvatar from '~/com/assets/default-feed-avatar.svg?url';
import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import FeedOverflowAction from './actions/FeedOverflowAction';

const LazyImageViewerDialog = lazy(() => import('~/com/components/dialogs/ImageViewerDialog'));

export interface FeedHeaderProps {
	feed?: SignalizedFeed;
}

const FeedHeader = (props: FeedHeaderProps) => {
	return (() => {
		const feed = props.feed;

		if (!feed) {
			return (
				<div class="shrink-0 p-4" style="height:172px">
					<div class="h-13 w-13 shrink-0 rounded-md bg-secondary/20"></div>
				</div>
			);
		}

		const creator = feed.creator;
		const isLiked = () => !!feed.viewer.like.value;

		return (
			<VirtualContainer class="shrink-0">
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
							<p class="overflow-hidden text-ellipsis break-words text-lg font-bold">{feed.name.value}</p>

							<Link
								to={/* @once */ { type: LINK_PROFILE, actor: creator.did }}
								class="group mt-1 flex items-center"
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
						<RichTextRenderer text={feed.description.value ?? ''} facets={feed.descriptionFacets.value} />
					</p>

					<Link
						to={{ type: LINK_FEED_LIKED_BY, actor: creator.did, rkey: getRecordId(feed.uri) }}
						class="text-sm text-muted-fg hover:underline"
					>
						Liked by {formatCompact(feed.likeCount.value)} users
					</Link>

					<div class="flex gap-2">
						<button
							title={!isLiked() ? `Like this feed` : `Unlike this feed`}
							onClick={() => {
								updateFeedLike(feed, !isLiked());
							}}
							class={/* @once */ BoxedIconButton()}
						>
							{isLiked() ? <FavoriteIcon class="text-red-500" /> : <FavoriteOutlinedIcon />}
						</button>

						<div class="grow"></div>

						<FeedOverflowAction feed={feed}>
							<button title="Actions" class={/* @once */ BoxedIconButton()}>
								<MoreHorizIcon />
							</button>
						</FeedOverflowAction>
					</div>
				</div>
			</VirtualContainer>
		);
	}) as unknown as JSX.Element;
};

export default FeedHeader;
