import { createEffect, createMemo } from 'solid-js';

import { createInfiniteQuery, createMutation, createQuery } from '@pkg/solid-query';

import type { UnionOf } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';
import { getRecordId } from '~/api/utils/misc';

import { getListMembers, getListMembersKey } from '~/api/queries/get-list-members';
import {
	getListMemberships,
	getListMembershipsKey,
	listMembershipsOptions,
	type ListMembership,
} from '~/api/queries/get-list-memberships';
import type { SignalizedList } from '~/api/stores/lists';

import { chunked, mapDefined } from '~/utils/misc';
import { difference } from '~/utils/sets';

import { closeModal, useModalState } from '../../../globals/modals';

import { Button } from '../../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../../primitives/dialog';

import DialogOverlay from '../DialogOverlay';

export interface PruneListOrphanDialogProps {
	/** Expected to be static */
	list: SignalizedList;
}

const PruneListOrphanDialog = (props: PruneListOrphanDialogProps) => {
	const list = props.list;
	const uri = list.uri;
	const uid = list.uid;

	const { disableBackdropClose, close } = useModalState();

	const memberships = createQuery(() => {
		return {
			queryKey: getListMembershipsKey(uid),
			queryFn: getListMemberships,
			...listMembershipsOptions,
		};
	});

	const members = createInfiniteQuery(() => {
		return {
			queryKey: getListMembersKey(list.uid, list.uri),
			queryFn: getListMembers,
			staleTime: 0,
			refetchOnMount: 'always',
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	const orphanUris = createMemo(() => {
		const $memberships = memberships.data;
		const $members = members.data;

		if ($memberships && $members) {
			const expectedUris = mapDefined($memberships, (x) => (x.listUri === uri ? x.itemUri : undefined));
			const actualUris = $members.pages.flatMap((page) => page.members.map((member) => member.uri));

			return Array.from(difference(expectedUris, actualUris));
		}
	});

	const pruneMutation = createMutation((queryClient) => ({
		mutationFn: async () => {
			const $orphanUris = orphanUris()!;

			const writes: UnionOf<'com.atproto.repo.applyWrites#delete'>[] = $orphanUris.map((uri) => ({
				$type: 'com.atproto.repo.applyWrites#delete',
				collection: 'app.bsky.graph.listitem',
				rkey: getRecordId(uri),
			}));

			const agent = await multiagent.connect(uid);

			const chunks = chunked(writes, 10);
			const promises = chunks.map((chunk) => {
				return agent.rpc.call('com.atproto.repo.applyWrites', {
					data: {
						repo: uid,
						writes: chunk,
					},
				});
			});

			try {
				const results = await Promise.allSettled(promises);

				for (const result of results) {
					if (result.status === 'rejected') {
						throw new Error(result.reason);
					}
				}
			} catch (err) {
				// We don't know which ones are still valid, so we have to invalidate
				// these queries to prevent stales.
				queryClient.invalidateQueries({
					queryKey: getListMembershipsKey(uid),
					exact: true,
				});

				queryClient.invalidateQueries({
					queryKey: ['getListMembers', uid, uri],
				});

				throw err;
			}

			return { uris: $orphanUris };
		},
		onSuccess: ({ uris }: { uris: string[] }) => {
			close();

			const set = new Set(uris);

			// 1. Update memberships data
			queryClient.setQueryData<ListMembership[]>(getListMembershipsKey(uid), (prev) => {
				if (prev) {
					return prev.filter((x) => !set.has(x.itemUri));
				}

				return prev;
			});
		},
	}));

	const orphanCount = () => {
		const $orphanUris = orphanUris();
		return $orphanUris ? $orphanUris.length : 'N/A';
	};

	createEffect(() => {
		if (!members.isFetchingNextPage && members.hasNextPage) {
			members.fetchNextPage();
		}
	});

	createEffect(() => {
		disableBackdropClose.value = pruneMutation.isPending;
	});

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Prune orphan list members?</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-4' })}>
					<p class="text-sm">
						This will prune <b>{orphanCount()}</b> orphan members from <b>{list.name.value}</b>.
					</p>

					{(() => {
						if (members.isFetching || memberships.isFetching) {
							return <p class="text-sm text-muted-fg">Retrieving list members</p>;
						}

						if (members.isError || memberships.isError) {
							return <p class="text-sm text-red-500">Something went wrong, try again later.</p>;
						}

						if (orphanCount() === 0) {
							return <p class="text-sm text-muted-fg">No pruning necessary.</p>;
						}
					})()}
				</div>

				<fieldset disabled={disableBackdropClose.value} class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>
					<button
						disabled={(() => {
							const $orphanUris = orphanUris();
							return members.isFetching || memberships.isFetching || !$orphanUris || $orphanUris.length < 1;
						})()}
						onClick={() => {
							pruneMutation.mutate();
						}}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						Prune
					</button>
				</fieldset>
			</div>
		</DialogOverlay>
	);
};

export default PruneListOrphanDialog;
