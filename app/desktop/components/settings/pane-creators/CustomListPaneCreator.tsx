import { For, Match, Show, Switch } from 'solid-js';

import { createInfiniteQuery } from '@pkg/solid-query';

import { multiagent } from '~/api/globals/agent.ts';

import { type CustomListPaneConfig, PaneType } from '../../../globals/panes.ts';

import * as dialog from '~/com/primitives/dialog.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import type { PaneCreatorProps } from './types.ts';

const CustomListPaneCreator = (props: PaneCreatorProps) => {
	const lists = createInfiniteQuery(() => ({
		queryKey: ['getProfileLists', props.uid, props.uid, 30] as const,
		queryFn: async (ctx) => {
			const [, uid, actor, limit] = ctx.queryKey;

			const agent = await multiagent.connect(uid);

			const response = await agent.rpc.get('app.bsky.graph.getLists', {
				signal: ctx.signal,
				params: {
					actor: actor,
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
			<div>
				<For each={lists.data?.pages.flatMap((page) => page.lists)}>
					{(list) => (
						<VirtualContainer estimateHeight={88}>
							<button
								onClick={() => {
									props.onAdd<CustomListPaneConfig>({
										type: PaneType.CUSTOM_LIST,
										list: { uri: list.uri, name: list.name },
									});
								}}
								class="flex w-full gap-3 px-4 py-3 text-left hover:bg-hinted"
							>
								<div class="mt-0.5 h-9 w-9 shrink-0 overflow-hidden rounded-md bg-muted-fg">
									<Show when={list.avatar}>{(avatar) => <img src={avatar()} class="h-full w-full" />}</Show>
								</div>

								<div class="flex min-w-0 grow flex-col">
									<p class="text-sm font-bold">{list.name}</p>
									<p class="text-sm text-muted-fg">List by @{list.creator.handle}</p>

									<Show when={list.description}>
										{(description) => (
											<div class="mt-1 whitespace-pre-wrap break-words text-sm">{description()}</div>
										)}
									</Show>
								</div>
							</button>
						</VirtualContainer>
					)}
				</For>
			</div>

			<Switch>
				<Match when={lists.isLoading || lists.isFetchingNextPage}>
					<div class="flex h-13 items-center justify-center border-divider">
						<CircularProgress />
					</div>
				</Match>

				<Match when={lists.hasNextPage}>
					<button
						onClick={() => lists.fetchNextPage()}
						class="flex h-13 w-full items-center justify-center text-sm text-accent hover:bg-hinted disabled:pointer-events-none"
					>
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

export default CustomListPaneCreator;
