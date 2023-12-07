import { type JSX, For, createSignal } from 'solid-js';

import { type InfiniteData, createInfiniteQuery, useQueryClient } from '@pkg/solid-query';

import { multiagent } from '~/api/globals/agent.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import {
	type ListMembersPage,
	type SelfListMember,
	getListMembers,
	getListMembersKey,
} from '~/api/queries/get-list-members.ts';
import type { SignalizedList } from '~/api/stores/lists.ts';

import { openModal } from '../../globals/modals.tsx';

import { IconButton } from '../../primitives/icon-button.ts';
import { MenuItem, MenuItemIcon, MenuRoot } from '../../primitives/menu.ts';
import { loadMoreBtn } from '../../primitives/interactive.ts';

import ConfirmDialog from '../dialogs/ConfirmDialog.tsx';
import GenericErrorView from '../views/GenericErrorView.tsx';
import CircularProgress from '../CircularProgress.tsx';
import { Flyout } from '../Flyout.tsx';
import { VirtualContainer } from '../VirtualContainer.tsx';

import DeleteIcon from '../../icons/baseline-delete.tsx';
import MoreHorizIcon from '../../icons/baseline-more-horiz.tsx';

import ProfileItem, { type ProfileItemAccessory, type ProfileItemProps } from '../items/ProfileItem.tsx';

export interface ListMembersListProps {
	/** Expected to be static */
	list: SignalizedList;
	onClick?: ProfileItemProps['onClick'];
}

const ListMembersList = (props: ListMembersListProps) => {
	const list = props.list;

	const members = createInfiniteQuery(() => {
		return {
			queryKey: getListMembersKey(list.uid, list.uri),
			queryFn: getListMembers,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	return [
		<div>
			<For each={members.data?.pages.flatMap((page) => page.members)}>
				{(member) => {
					if ('uri' in member) {
						if (!member.profile) {
							return (
								<div class="flex items-center gap-3 px-4 py-3 text-sm">
									<div class="h-12 w-12 shrink-0 rounded-full bg-muted-fg"></div>

									<div class="text-muted-fg">
										<p>This user no longer exists</p>
										<p>{/* @once */ member.subject}</p>
									</div>
								</div>
							);
						}

						return (
							<OwnedListItem
								profile={/* @once */ member.profile}
								itemUri={/* @once */ member.uri}
								listUri={/* @once */ list.uri}
								onClick={props.onClick}
							/>
						);
					}

					return (
						<VirtualContainer estimateHeight={88}>
							<ProfileItem profile={/* @once */ member.profile} onClick={props.onClick} />
						</VirtualContainer>
					);
				}}
			</For>
		</div>,

		() => {
			if (members.isFetching) {
				return (
					<div class="grid h-13 place-items-center">
						<CircularProgress />
					</div>
				);
			}

			if (members.isError) {
				return (
					<GenericErrorView
						error={members.error}
						onRetry={() => {
							if (members.isRefetchError || members.isLoadingError) {
								members.refetch();
							} else {
								// @ts-expect-error
								members.fetchNextPage();
							}
						}}
					/>
				);
			}

			if (members.hasNextPage) {
				return (
					<button onClick={() => members.fetchNextPage()} class={loadMoreBtn}>
						Show more profiles
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

export default ListMembersList;

/** All of the props are expected to be static */
interface OwnedListItemProps extends Pick<ProfileItemProps, 'profile' | 'onClick'> {
	itemUri: string;
	listUri: string;
}

const OwnedListItem = (props: OwnedListItemProps) => {
	const { profile, itemUri, listUri } = props;

	const queryClient = useQueryClient();
	const [deleted, setDeleted] = createSignal(false);

	const onRemove = async () => {
		if (deleted()) {
			return;
		}

		setDeleted(true);

		try {
			const uid = profile.uid;
			const agent = await multiagent.connect(uid);

			await agent.rpc.call('com.atproto.repo.deleteRecord', {
				data: {
					repo: uid,
					collection: 'app.bsky.graph.listitem',
					rkey: getRecordId(itemUri),
				},
			});

			queryClient.setQueryData<InfiniteData<ListMembersPage>>(getListMembersKey(uid, listUri), (prev) => {
				if (prev) {
					return {
						...prev,
						pages: prev.pages.map((page) => {
							return {
								...page,
								members: page.members.filter((member) => (member as SelfListMember).uri !== itemUri),
							};
						}),
					};
				}

				return prev;
			});
		} catch (_err) {}
	};

	const accessory: ProfileItemAccessory = {
		render: () => {
			const button = (
				<button class={/* @once */ IconButton({ color: 'muted', edge: 'right' })}>
					<MoreHorizIcon />
				</button>
			);

			if (import.meta.env.VITE_MODE === 'desktop') {
				return (
					<Flyout button={button}>
						{({ close, menuProps }) => (
							<div {...menuProps} class={/* @once */ MenuRoot()}>
								<button
									onClick={() => {
										close();

										openModal(() => (
											<ConfirmDialog
												title={`Remove @${profile.handle.value}?`}
												body={`This can't be undone, the user will be removed from this list.`}
												confirmation="Remove"
												onConfirm={onRemove}
											/>
										));
									}}
									class={/* @once */ MenuItem({ variant: 'danger' })}
								>
									<DeleteIcon class={/* @once */ MenuItemIcon()} />
									<span>Remove from list</span>
								</button>
							</div>
						)}
					</Flyout>
				);
			}

			return button;
		},
	};

	return (
		<VirtualContainer estimateHeight={88} class={deleted() ? `pointer-events-none opacity-50` : undefined}>
			<ProfileItem profile={profile} aside={accessory} onClick={/* @once */ props.onClick} />
		</VirtualContainer>
	);
};
