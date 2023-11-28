import { For, createSignal } from 'solid-js';

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

import { openModal } from '~/com/globals/modals.tsx';

import { IconButton } from '~/com/primitives/icon-button.ts';
import { Interactive, loadMoreBtn } from '~/com/primitives/interactive.ts';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog.tsx';
import GenericErrorView from '~/com/components/views/GenericErrorView.tsx';
import CircularProgress from '~/com/components/CircularProgress.tsx';
import { Flyout } from '~/com/components/Flyout.tsx';
import { LinkingType, useLinking } from '~/com/components/Link.tsx';
import { VirtualContainer } from '~/com/components/VirtualContainer.tsx';

import DeleteIcon from '~/com/icons/baseline-delete.tsx';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';

import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

import ProfileItem, {
	type ProfileItemAccessory,
	type ProfileItemProps,
} from '~/com/components/items/ProfileItem.tsx';

export interface ListMembersPaneDialogProps {
	/** Expected to be static */
	list: SignalizedList;
}

const ListMembersPaneDialog = (props: ListMembersPaneDialogProps) => {
	const linking = useLinking();

	const list = props.list;

	const members = createInfiniteQuery(() => {
		return {
			queryKey: getListMembersKey(list.uid, list.uri),
			queryFn: getListMembers,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	const handleItemClick: ProfileItemProps['onClick'] = (profile) => {
		linking.navigate({ type: LinkingType.PROFILE, actor: profile.did });
	};

	return (
		<PaneDialog>
			<PaneDialogHeader title="List members" subtitle={list.name.value} />

			<div class="flex min-h-0 grow flex-col overflow-y-auto">
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
										onClick={handleItemClick}
									/>
								);
							}

							return (
								<VirtualContainer estimateHeight={88}>
									<ProfileItem profile={/* @once */ member.profile} onClick={handleItemClick} />
								</VirtualContainer>
							);
						}}
					</For>
				</div>

				{(() => {
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
				})()}
			</div>
		</PaneDialog>
	);
};

export default ListMembersPaneDialog;

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
			return (
				<Flyout
					button={
						<button class={/* @once */ IconButton({ color: 'muted', edge: 'right' })}>
							<MoreHorizIcon />
						</button>
					}
				>
					{({ close, menuProps }) => (
						<div {...menuProps} class="flex flex-col overflow-hidden rounded-lg bg-background shadow-menu">
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
								class={
									/* @once */ Interactive({
										variant: 'danger',
										class: `flex items-center gap-4 px-4 py-3 text-left text-sm text-red-500`,
									})
								}
							>
								<DeleteIcon class="text-lg" />
								<span>Remove from list</span>
							</button>
						</div>
					)}
				</Flyout>
			);
		},
	};

	return (
		<VirtualContainer estimateHeight={88} class={deleted() ? `pointer-events-none opacity-50` : undefined}>
			<ProfileItem profile={profile} aside={accessory} onClick={/* @once */ props.onClick} />
		</VirtualContainer>
	);
};
