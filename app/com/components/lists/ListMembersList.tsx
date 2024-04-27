import { type InfiniteData, createInfiniteQuery, useQueryClient } from '@mary/solid-query';

import { multiagent } from '~/api/globals/agent';
import { getRecordId } from '~/api/utils/misc';

import { type ListMembersPage, getListMembers, getListMembersKey } from '~/api/queries/get-list-members';
import {
	type ListMembership,
	findMembership,
	getListMembershipsKey,
} from '~/api/queries/get-list-memberships';
import type { SignalizedList } from '~/api/stores/lists';

import { produce } from '~/utils/immer';

import { openModal } from '../../globals/modals';

import { IconButton } from '../../primitives/icon-button';
import { MenuItem, MenuItemIcon, MenuRoot } from '../../primitives/menu';

import ConfirmDialog from '../dialogs/ConfirmDialog';
import { Flyout } from '../Flyout';
import { VirtualContainer } from '../VirtualContainer';

import DeleteIcon from '../../icons/baseline-delete';
import MoreHorizIcon from '../../icons/baseline-more-horiz';

import List from '../List';
import ProfileItem, { type ProfileItemAccessory, type ProfileItemProps } from '../items/ProfileItem';

export interface ListMembersListProps {
	/** Expected to be static */
	list: SignalizedList;
	onClick?: ProfileItemProps['onClick'];
}

const ListMembersList = (props: ListMembersListProps) => {
	const list = props.list;
	const onClick = props.onClick;

	const members = createInfiniteQuery(() => {
		return {
			queryKey: getListMembersKey(list.uid, list.uri),
			queryFn: getListMembers,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	const isOwner = list.uid === list.creator.did;

	return (
		<List
			data={members.data?.pages.flatMap((page) => page.members)}
			error={members.error}
			render={(member) => {
				if (isOwner) {
					return (
						<ListItem
							profile={/* @once */ member.profile}
							itemUri={/* @once */ member.uri}
							listUri={/* @once */ list.uri}
							onClick={onClick}
						/>
					);
				}

				return (
					<VirtualContainer estimateHeight={88}>
						<ProfileItem profile={/* @once */ member.profile} onClick={onClick} />
					</VirtualContainer>
				);
			}}
			hasNextPage={members.hasNextPage}
			isFetchingNextPage={members.isFetching}
			onEndReached={() => members.fetchNextPage()}
		/>
	);
};

export default ListMembersList;

/** All of the props are expected to be static */
interface ListItemProps extends Pick<ProfileItemProps, 'profile' | 'onClick'> {
	itemUri: string;
	listUri: string;
}

const ListItem = (props: ListItemProps) => {
	const { profile, itemUri, listUri } = props;

	const queryClient = useQueryClient();

	const onRemove = async () => {
		const uid = profile.uid;

		queryClient.setQueryData<InfiniteData<ListMembersPage>>(getListMembersKey(uid, listUri), (prev) => {
			if (prev) {
				return produce(prev, (draft) => {
					const pages = draft.pages;

					for (let i = 0, ilen = pages.length; i < ilen; i++) {
						const page = pages[i];
						const members = page.members;

						for (let j = 0, jlen = members.length; j < jlen; j++) {
							const member = members[j];

							if (member.uri === itemUri) {
								members.splice(j, 1);
								return;
							}
						}
					}
				});
			}

			return prev;
		});

		queryClient.setQueryData<ListMembership[]>(getListMembershipsKey(uid), (prev) => {
			if (prev) {
				const index = findMembership(prev, listUri, profile.did);

				if (index !== null) {
					const next = prev.slice();
					next.splice(index, 1);

					return next;
				}
			}

			return prev;
		});

		const agent = await multiagent.connect(uid);

		await agent.rpc.call('com.atproto.repo.deleteRecord', {
			data: {
				repo: uid,
				collection: 'app.bsky.graph.listitem',
				rkey: getRecordId(itemUri),
			},
		});
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
		<VirtualContainer estimateHeight={88}>
			<ProfileItem profile={profile} aside={accessory} onClick={/* @once */ props.onClick} />
		</VirtualContainer>
	);
};
