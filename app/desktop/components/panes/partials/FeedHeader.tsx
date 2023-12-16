import { type JSX, lazy, createMemo } from 'solid-js';

import { useQueryClient } from '@pkg/solid-query';

import type { DID, RefOf } from '~/api/atp-schema.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { feedShadow } from '~/api/caches/feeds.ts';
import { updateFeedLike } from '~/api/mutations/like-feed.ts';

import { formatCompact } from '~/utils/intl/number.ts';

import { openModal } from '~/com/globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';

import { LINK_FEED_LIKED_BY, LINK_PROFILE, Link } from '~/com/components/Link.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import DefaultFeedAvatar from '~/com/assets/default-feed-avatar.svg?url';
import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';
import FavoriteIcon from '~/com/icons/baseline-favorite.tsx';
import FavoriteOutlinedIcon from '~/com/icons/outline-favorite.tsx';

const LazyImageViewerDialog = lazy(() => import('~/com/components/dialogs/ImageViewerDialog.tsx'));

export interface FeedHeaderProps {
	uid: DID;
	feed?: RefOf<'app.bsky.feed.defs#generatorView'>;
}

const FeedHeader = (props: FeedHeaderProps) => {
	const hasList = createMemo(() => props.feed !== undefined);

	return (() => {
		if (hasList()) {
			return renderFeedHeader(props.uid, () => props.feed!);
		}

		return renderFallback();
	}) as unknown as JSX.Element;
};

const renderFallback = () => {
	return (
		<div class="shrink-0 p-4" style="height:172px">
			<div class="h-13 w-13 shrink-0 rounded-md bg-secondary/20"></div>
		</div>
	);
};

const renderFeedHeader = (uid: DID, feed: () => RefOf<'app.bsky.feed.defs#generatorView'>) => {
	const client = useQueryClient();

	const shadowed = feedShadow.get(feed);
	const creator = createMemo(() => feed().creator);

	const isLiked = () => {
		return shadowed().viewer?.like;
	};

	return (
		<VirtualContainer class="shrink-0">
			<div class="flex flex-col gap-4 p-4">
				<div class="flex gap-4">
					{(() => {
						const avatar = feed().avatar;

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

					<div class="grow">
						<p class="break-words text-lg font-bold">{feed().displayName}</p>

						<Link
							to={/* @once */ { type: LINK_PROFILE, actor: creator().did }}
							class="group mt-1 flex items-center text-left"
							children={(() => {
								// We needed to destroy the image element, so let's do them all
								// in one single template anyway.
								const $creator = feed().creator;

								return (
									<div class="contents">
										<img
											src={/* @once */ $creator.avatar || DefaultUserAvatar}
											class="mr-2 h-5 w-5 rounded-full"
										/>
										<span class="mr-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm font-bold empty:hidden group-hover:underline">
											{/* @once */ $creator.displayName}
										</span>
										<span class="overflow-hidden text-ellipsis whitespace-nowrap text-sm text-muted-fg">
											{/* @once */ '@' + $creator.handle}
										</span>
									</div>
								);
							})()}
						/>
					</div>
				</div>

				<p class="whitespace-pre-wrap break-words text-sm empty:hidden">{feed().description}</p>

				<Link
					to={{ type: LINK_FEED_LIKED_BY, actor: creator().did, rkey: getRecordId(feed().uri) }}
					class="text-left text-sm text-muted-fg hover:underline"
				>
					Liked by {formatCompact(shadowed().likeCount ?? 0)} users
				</Link>

				<div class="flex gap-2">
					<button
						title={!isLiked() ? `Like this feed` : `Unlike this feed`}
						onClick={() => {
							updateFeedLike(client, uid, shadowed());
						}}
						class={/* @once */ Button({ variant: 'outline' })}
					>
						{isLiked() ? (
							<FavoriteIcon class="-mx-1.5 text-base text-red-500" />
						) : (
							<FavoriteOutlinedIcon class="-mx-1.5 text-base" />
						)}
					</button>
				</div>
			</div>
		</VirtualContainer>
	);
};

export default FeedHeader;
