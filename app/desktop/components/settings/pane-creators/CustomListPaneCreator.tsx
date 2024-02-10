import { For, Match, Switch, createSignal, lazy } from 'solid-js';

import { createInfiniteQuery, useQueryClient } from '@pkg/solid-query';

import type { DID, RefOf } from '~/api/atp-schema';
import { multiagent, renderAccountName } from '~/api/globals/agent';

import { openModal } from '~/com/globals/modals';

import { type CustomListPaneConfig, PANE_TYPE_LIST } from '../../../globals/panes';

import { DialogBody } from '~/com/primitives/dialog';
import { Interactive, loadMoreBtn } from '~/com/primitives/interactive';

import CircularProgress from '~/com/components/CircularProgress';
import { VirtualContainer } from '~/com/components/VirtualContainer';
import FilterBar from '~/com/components/inputs/FilterBar';

import type { PaneCreatorProps } from './types';

import DefaultListAvatar from '~/com/assets/default-list-avatar.svg?url';
import AddIcon from '~/com/icons/baseline-add';

const AddListDialog = lazy(() => import('~/com/components/dialogs/lists/AddListDialog'));

type List = RefOf<'app.bsky.graph.defs#listView'>;

const listItem = Interactive({
	variant: 'muted',
	class: `flex w-full cursor-pointer flex-col gap-3 px-4 py-3 text-left text-sm`,
});

const getCurationListKey = (uid: DID, filter: DID) => {
	return ['getProfileCurationLists', uid, filter, 30] as const;
};

const CustomListPaneCreator = (props: PaneCreatorProps) => {
	const [filter, setFilter] = createSignal<DID>(props.uid);

	const queryClient = useQueryClient();

	const lists = createInfiniteQuery(() => ({
		queryKey: getCurationListKey(props.uid, filter()),
		queryFn: async (ctx) => {
			const [, uid, actor, limit] = ctx.queryKey;

			const param = ctx.pageParam;
			const agent = await multiagent.connect(uid);

			let attempts = 0;
			let cursor: string | null | undefined;
			let items: List[] = [];

			if (param) {
				cursor = param.key;
				items = param.remaining;
			}

			// We don't have enough to fulfill this request...
			while (cursor !== null && items.length < limit) {
				const response = await agent.rpc.get('app.bsky.graph.getLists', {
					params: {
						actor: actor,
						limit: limit,
						cursor: cursor,
					},
				});

				const data = response.data;
				const filtered = data.lists.filter((list) => list.purpose === 'app.bsky.graph.defs#curatelist');

				items = items.concat(filtered);
				cursor = data.cursor || null;

				// Give up after 2 attempts
				if (++attempts >= 2) {
					break;
				}
			}

			const lists = items.slice(0, limit);
			const remaining = items.slice(limit);

			return {
				cursor: cursor || remaining.length > 0 ? { key: cursor || null, remaining: remaining } : undefined,
				lists: lists,
			};
		},
		getNextPageParam: (last) => last.cursor,
		initialPageParam: undefined as { key: string | null; remaining: List[] } | undefined,
	}));

	const openAddList = () => {
		openModal(() => (
			<AddListDialog
				uid={props.uid}
				type="app.bsky.graph.defs#curatelist"
				onSubmit={() => {
					queryClient.resetQueries({
						exact: true,
						queryKey: getCurationListKey(props.uid, filter()),
					});
				}}
			/>
		));
	};

	return (
		<div class={/* @once */ DialogBody({ padded: false, scrollable: true })}>
			{multiagent.accounts.length > 1 && (
				<div class="p-4">
					<FilterBar
						value={filter()}
						onChange={setFilter}
						items={multiagent.accounts.map((account) => ({
							value: account.did,
							get label() {
								return `${renderAccountName(account)}'s lists`;
							},
						}))}
					/>
				</div>
			)}

			<div>
				{(() => {
					if (filter() === props.uid) {
						return (
							<button
								onClick={openAddList}
								class={
									/* @once */ Interactive({
										variant: 'muted',
										class: `flex w-full items-center gap-3 px-4 py-3 text-left text-sm`,
									})
								}
							>
								<AddIcon class="text-lg" />
								<span>Create user list</span>
							</button>
						);
					}
				})()}

				<For each={lists.data?.pages.flatMap((page) => page.lists)}>
					{(list) => (
						<VirtualContainer estimateHeight={88}>
							<button
								onClick={() => {
									props.onAdd<CustomListPaneConfig>({
										type: PANE_TYPE_LIST,
										list: { uri: list.uri, name: list.name },
										showReplies: true,
										showQuotes: true,
										infoVisible: true,
									});
								}}
								class={listItem}
							>
								<div class="flex gap-4">
									<img
										src={/* @once */ list.avatar || DefaultListAvatar}
										class="mt-0.5 h-9 w-9 shrink rounded-md"
									/>

									<div class="min-w-0 grow">
										<p class="overflow-hidden text-ellipsis font-bold">{/* @once */ list.name}</p>
										<p class="text-muted-fg">{/* @once */ `by @${list.creator.handle}`}</p>
									</div>
								</div>

								<div class="max-w-full whitespace-pre-wrap break-words text-sm empty:hidden">
									{/* @once */ list.description}
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
					<button onClick={() => lists.fetchNextPage()} class={loadMoreBtn}>
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
