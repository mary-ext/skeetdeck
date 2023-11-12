import { For, Match, Show, Switch, createSignal } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import { multiagent } from '~/api/globals/agent.ts';

import { type CustomFeedPaneConfig, PaneType } from '~/desktop/globals/panes.ts';

import * as dialog from '~/com/primitives/dialog.ts';
import input from '~/com/primitives/input.ts';
import interactive from '~/com/primitives/interactive.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import SearchIcon from '~/com/icons/baseline-search.tsx';

import type { PaneCreatorProps } from './types.ts';

const feedItem = interactive({
	class: 'flex w-full cursor-pointer flex-col gap-3 px-4 py-3 text-left text-sm',
});

const showMoreBtn = interactive({
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
		<div class={/* @once */ dialog.body({ padded: false, scrollable: true })}>
			<div class="flex gap-4 p-4">
				<div class="relative grow">
					<div class="pointer-events-none absolute inset-y-0 ml-px grid place-items-center px-2">
						<SearchIcon class="text-lg text-muted-fg" />
					</div>
					<input
						class={/* @once */ input({ class: 'pl-8' })}
						placeholder="Search..."
						onKeyDown={(ev) => {
							if (ev.key === 'Enter') {
								setSearch(ev.currentTarget.value.trim());
							}
						}}
					/>
				</div>

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
									type: PaneType.CUSTOM_FEED,
									feed: { uri: feed.uri, name: feed.displayName },
								});
							}}
							class={feedItem}
						>
							<div class="flex items-center gap-4">
								<div class="h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted-fg">
									<Show when={feed.avatar}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
								</div>

								<div class="min-w-0 grow">
									<p class="overflow-hidden text-ellipsis font-bold">{feed.displayName}</p>
									<p class="text-muted-fg">by @{feed.creator.handle}</p>
								</div>
							</div>

							<Show when={feed.description}>
								{(description) => (
									// @todo: not sure why `max-w-full` is necessary here, yet it does
									<div class="max-w-full whitespace-pre-wrap break-words text-sm">{description()}</div>
								)}
							</Show>
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
