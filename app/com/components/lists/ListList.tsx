import { type JSX, For } from 'solid-js';

import { createInfiniteQuery } from '@mary/solid-query';

import type { At } from '~/api/atp-schema';

import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists';

import { loadMoreBtn } from '../../primitives/interactive';

import GenericErrorView from '../views/GenericErrorView';
import CircularProgress from '../CircularProgress';
import { VirtualContainer } from '../VirtualContainer';

import ListItem from '../items/ListItem';

export interface ListListProps {
	uid: At.DID;
	actor: string;
}

const ListList = (props: ListListProps) => {
	const lists = createInfiniteQuery(() => {
		return {
			queryKey: getProfileListsKey(props.uid, props.actor),
			queryFn: getProfileLists,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	return [
		<div>
			<For each={lists.data?.pages.flatMap((page) => page.lists)}>
				{(list) => {
					return (
						<VirtualContainer estimateHeight={96}>
							<ListItem list={list} />
						</VirtualContainer>
					);
				}}
			</For>
		</div>,

		() => {
			if (lists.isFetching) {
				return (
					<div class="grid h-13 shrink-0 place-items-center">
						<CircularProgress />
					</div>
				);
			}

			if (lists.isError) {
				return (
					<GenericErrorView
						error={lists.error}
						onRetry={() => {
							lists.fetchNextPage();
						}}
					/>
				);
			}

			if (lists.hasNextPage) {
				return (
					<button onClick={() => lists.fetchNextPage()} class={loadMoreBtn}>
						Show more feeds
					</button>
				);
			}

			return (
				<div class="grid h-13 shrink-0 place-items-center">
					<p class="text-sm text-muted-fg">End of list</p>
				</div>
			);
		},
	] as unknown as JSX.Element;
};

export default ListList;
