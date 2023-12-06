import { For, Match, Show, Switch, createSignal } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import { multiagent } from '~/api/globals/agent.ts';

import { type CustomFeedPaneConfig, PANE_TYPE_FEED } from '../../../globals/panes.ts';

import { DialogBody } from '~/com/primitives/dialog.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import SearchInput from '~/com/components/inputs/SearchInput.tsx';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import type { PaneCreatorProps } from './types.ts';

import DefaultFeedAvatar from '~/com/assets/default-feed-avatar.svg?url';

const feedItem = Interactive({
	variant: 'muted',
	class: 'flex w-full cursor-pointer flex-col gap-3 px-4 py-3 text-left text-sm',
});

const showMoreBtn = Interactive({
	class: 'flex h-13 w-full items-center justify-center text-sm text-accent disabled:pointer-events-none',
});

const CustomFeedPaneCreator = (props: PaneCreatorProps) => {
	const [search, setSearch] = createSignal('');

	const feeds = createInfiniteQuery(() => ({
		queryKey: ['getPopularFeedGenerators', props.uid, search(), 30] as const,
		queryFn: async (ctx) => {
			const [, uid, search, limit] = ctx.queryKey;

			const agent = await multiagent.connect(uid);

			const response = await agent.rpc.get('app.bsky.unspecced.getPopularFeedGenerators', {
				signal: ctx.signal,
				params: {
					query: search,
					limit: limit,
					cursor: ctx.pageParam,
				},
			});

			return response.data;
		},
		getNextPageParam: (last) => last.cursor,
		initialPageParam: undefined as string | undefined,
	}));

	return (
		<div class={/* @once */ DialogBody({ padded: false, scrollable: true })}>
			<div class="flex gap-4 p-4">
				<SearchInput
					onKeyDown={(ev) => {
						if (ev.key === 'Enter') {
							setSearch(ev.currentTarget.value.trim());
						}
					}}
				/>

				{/* @todo: filter by one's saved feeds or own feeds */}
			</div>

			<Show when={search()}>
				<p class="-mt-1 px-4 pb-2 text-sm text-muted-fg">
					Searching for "<span class="whitespace-pre-wrap break-words">{search()}</span>"
				</p>
			</Show>

			<For each={feeds.data?.pages.flatMap((page) => page.feeds)}>
				{(feed) => (
					<VirtualContainer estimateHeight={98}>
						<button
							onClick={() => {
								props.onAdd<CustomFeedPaneConfig>({
									type: PANE_TYPE_FEED,
									feed: { uri: feed.uri, name: feed.displayName },
									infoVisible: true,
								});
							}}
							class={feedItem}
						>
							<div class="flex gap-4">
								<img
									src={/* @once */ feed.avatar || DefaultFeedAvatar}
									class="mt-0.5 h-9 w-9 shrink rounded-md"
								/>

								<div class="min-w-0 grow">
									<p class="overflow-hidden text-ellipsis font-bold">{/* @once */ feed.displayName}</p>
									<p class="text-muted-fg">{/* @once */ `by ${feed.creator.handle}`}</p>
								</div>
							</div>

							<div class="max-w-full whitespace-pre-wrap break-words text-sm empty:hidden">
								{/* @once */ feed.description}
							</div>
						</button>
					</VirtualContainer>
				)}
			</For>

			<Switch>
				<Match when={feeds.isLoading || feeds.isFetchingNextPage}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={feeds.hasNextPage}>
					<button onClick={() => feeds.fetchNextPage()} class={showMoreBtn}>
						Show more
					</button>
				</Match>

				<Match when>
					<div class="flex h-13 items-center justify-center">
						<p class="text-sm text-muted-fg">End of list</p>
					</div>
				</Match>
			</Switch>
		</div>
	);
};

export default CustomFeedPaneCreator;
