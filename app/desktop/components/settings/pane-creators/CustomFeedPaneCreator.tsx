import { For, Match, Switch, createSignal } from 'solid-js';

import { createInfiniteQuery } from '@externdefs/solid-query';

import type { AppBskyUnspeccedGetPopularFeedGenerators, At } from '~/api/atp-schema';
import { multiagent, renderAccountName } from '~/api/globals/agent';

import { type CustomFeedPaneConfig, PANE_TYPE_FEED } from '../../../globals/panes';

import { DialogBody } from '~/com/primitives/dialog';
import { Interactive } from '~/com/primitives/interactive';

import CircularProgress from '~/com/components/CircularProgress';
import { VirtualContainer } from '~/com/components/VirtualContainer';
import SearchInput from '~/com/components/inputs/SearchInput';
import FilterBar from '~/com/components/inputs/FilterBar';

import type { PaneCreatorProps } from './types';

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
	const [filter, setFilter] = createSignal<At.DID>();

	const feeds = createInfiniteQuery(() => ({
		queryKey: ['getPopularFeedGenerators', props.uid, filter(), search(), 30] as const,
		queryFn: async (ctx) => {
			const [, uid, actor, search, limit] = ctx.queryKey;

			const agent = await multiagent.connect(uid);

			let data: AppBskyUnspeccedGetPopularFeedGenerators.Output;
			if (actor) {
				const response = await agent.rpc.get('app.bsky.feed.getActorFeeds', {
					signal: ctx.signal,
					params: {
						actor: actor,
						limit: limit,
						cursor: ctx.pageParam,
					},
				});

				data = response.data;
			} else {
				const response = await agent.rpc.get('app.bsky.unspecced.getPopularFeedGenerators', {
					signal: ctx.signal,
					params: {
						query: search,
						limit: limit,
						cursor: ctx.pageParam,
					},
				});

				data = response.data;
			}

			return data;
		},
		getNextPageParam: (last) => last.cursor,
		initialPageParam: undefined as string | undefined,
	}));

	return (
		<div class={/* @once */ DialogBody({ padded: false, scrollable: true })}>
			<div class="p-4">
				<FilterBar
					value={filter()}
					onChange={setFilter}
					items={[
						{ value: undefined, label: `All` },
						...multiagent.accounts.map((account) => ({
							value: account.did,
							get label() {
								return `${renderAccountName(account)}'s feeds`;
							},
						})),
					]}
				/>
			</div>

			{!filter() && (
				<>
					<div class="flex gap-4 p-4 pt-0">
						<SearchInput
							onKeyDown={(ev) => {
								if (ev.key === 'Enter') {
									setSearch(ev.currentTarget.value.trim());
								}
							}}
						/>
					</div>

					{search() && (
						<p class="-mt-1 px-4 pb-2 text-sm text-muted-fg">
							Searching for "<span class="whitespace-pre-wrap break-words">{search()}</span>"
						</p>
					)}
				</>
			)}

			<For each={feeds.data?.pages.flatMap((page) => page.feeds)}>
				{(feed) => (
					<VirtualContainer estimateHeight={98}>
						<button
							onClick={() => {
								props.onAdd<CustomFeedPaneConfig>({
									type: PANE_TYPE_FEED,
									feed: { uri: feed.uri, name: feed.displayName },
									showReplies: true,
									showReposts: true,
									showQuotes: true,
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
									<p class="text-muted-fg">{/* @once */ `by @${feed.creator.handle}`}</p>
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
