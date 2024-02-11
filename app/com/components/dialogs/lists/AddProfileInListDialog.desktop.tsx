import { For, createEffect, createMemo, createSignal } from 'solid-js';

import {
	type InfiniteData,
	createInfiniteQuery,
	createMutation,
	createQuery,
	useQueryClient,
} from '@pkg/solid-query';

import type { Records, UnionOf } from '~/api/atp-schema';
import { multiagent, renderAccountName } from '~/api/globals/agent';
import { renderListPurpose } from '~/api/display';
import { getCurrentTid } from '~/api/utils/tid';
import { getCurrentDate, getRecordId } from '~/api/utils/misc';

import type { ListMembersPage } from '~/api/queries/get-list-members';
import {
	type ListMembership,
	getListMemberships,
	getListMembershipsKey,
	listMembershipsOptions,
} from '~/api/queries/get-list-memberships';
import { getProfileKey } from '~/api/queries/get-profile';
import { getProfileLists, getProfileListsKey } from '~/api/queries/get-profile-lists';

import { createDerivedSignal } from '~/utils/hooks';
import { produce } from '~/utils/immer';
import { chunked, clsx, mapDefined } from '~/utils/misc';
import { difference } from '~/utils/sets';

import { closeModal, useModalState } from '../../../globals/modals';

import { Button } from '~/com/primitives/button';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../../primitives/dialog';
import { IconButton } from '../../../primitives/icon-button';
import { Interactive, loadMoreBtn } from '~/com/primitives/interactive';

import GenericErrorView from '../../views/GenericErrorView';
import FilterBar from '../../inputs/FilterBar';
import CircularProgress from '../../CircularProgress';
import DialogOverlay from '../DialogOverlay';

import CloseIcon from '../../../icons/baseline-close';
import CheckIcon from '../../../icons/baseline-check';

import DefaultListAvatar from '../../../assets/default-list-avatar.svg?url';

import type { AddProfileInListDialogProps } from './AddProfileInListDialog';

const listItem = Interactive({
	variant: 'muted',
	class: `flex min-w-0 items-center gap-3 px-4 py-3 text-left disabled:opacity-50`,
});

const isSetEqual = <T,>(a: Set<T>, b: Set<T>): boolean => {
	if (a.size !== b.size) {
		return false;
	}

	for (const val of a) {
		if (!b.has(val)) {
			return false;
		}
	}

	return true;
};

const AddProfileInListDialog = (props: AddProfileInListDialogProps) => {
	const queryClient = useQueryClient();
	const { close, disableBackdropClose } = useModalState();

	const profile = props.profile;
	const did = profile.did;

	const [uid, setUid] = createSignal(profile.uid);

	const lists = createInfiniteQuery(() => {
		const $uid = uid();

		return {
			queryKey: getProfileListsKey($uid, $uid),
			queryFn: getProfileLists,
			initialPageParam: undefined,
			getNextPageParam: (last) => last.cursor,
		};
	});

	const memberships = createQuery(() => {
		return {
			queryKey: getListMembershipsKey(uid()),
			queryFn: getListMemberships,
			...listMembershipsOptions,
		};
	});

	const listMutation = createMutation(() => ({
		mutationFn: async () => {
			const deletions: UnionOf<'com.atproto.repo.applyWrites#delete'>[] = [];
			const creations: UnionOf<'com.atproto.repo.applyWrites#create'>[] = [];

			const $uid = uid();

			const date = getCurrentDate();

			const a = new Set(prevListUris());
			const b = new Set(listUris());

			const removals = difference(a, b);
			const additions = difference(b, a);

			const $memberships = memberships.data!;

			for (let i = 0, il = $memberships.length; i < il; i++) {
				const item = $memberships[i];

				if (item.actor === did && removals.has(item.listUri)) {
					deletions.push({
						$type: 'com.atproto.repo.applyWrites#delete',
						collection: 'app.bsky.graph.listitem',
						rkey: getRecordId(item.itemUri),
					});
				}
			}

			for (const listUri of additions) {
				const record: Records['app.bsky.graph.listitem'] = {
					list: listUri,
					subject: did,
					createdAt: date,
				};

				creations.push({
					$type: 'com.atproto.repo.applyWrites#create',
					collection: 'app.bsky.graph.listitem',
					rkey: getCurrentTid(),
					value: record,
				});
			}

			const agent = await multiagent.connect($uid);

			const writes = [...creations, ...deletions];
			const promises = chunked(writes, 10).map((chunk) => {
				return agent.rpc.call('com.atproto.repo.applyWrites', {
					data: {
						repo: $uid,
						writes: chunk,
					},
				});
			});

			await Promise.all(promises);

			return { uid: $uid, creations, removals };
		},
		onSuccess({ uid, creations, removals }) {
			close();

			// 1. Update memberships data
			queryClient.setQueryData<ListMembership[]>(getListMembershipsKey(uid), (prev) => {
				if (prev) {
					const next = mapDefined(prev, (item) => {
						return item.actor !== did || !removals.has(item.listUri) ? item : undefined;
					});

					for (let i = 0, il = creations.length; i < il; i++) {
						const cr = creations[i];

						next.push({
							actor: did,
							itemUri: `at://${uid}/app.bsky.graph.listitem/${cr.rkey!}`,
							listUri: (cr.value as Records['app.bsky.graph.listitem']).list,
						});
					}

					return next;
				}

				return prev;
			});

			// 2. Remove user from removed lists
			for (const listUri of removals) {
				queryClient.setQueriesData<InfiniteData<ListMembersPage>>(
					{ queryKey: ['getListMembers', uid, listUri] },
					(prev) => {
						if (prev) {
							return produce(prev, (draft) => {
								const pages = draft.pages;

								for (let i = 0, ilen = pages.length; i < ilen; i++) {
									const page = pages[i];
									const members = page.members;

									for (let j = 0, jlen = members.length; j < jlen; j++) {
										const member = members[j];

										if (member.profile.did === did) {
											members.splice(j, 1);
											return;
										}
									}
								}
							});
						}

						return prev;
					},
				);
			}

			// 3. Invalidate profile data of said user (if user's being put on an active mute/block list)
			queryClient.invalidateQueries({
				queryKey: getProfileKey(uid, did),
				exact: true,
			});
		},
	}));

	const prevListUris = createMemo((): string[] => {
		const $memberships = memberships.data;

		if ($memberships) {
			return mapDefined($memberships, (item) => {
				return item.actor === did ? item.listUri : undefined;
			});
		}

		return [];
	});

	const [listUris, setListUris] = createDerivedSignal(prevListUris);

	const isEqual = createMemo(() => isSetEqual(new Set(prevListUris()), new Set(listUris())));

	createEffect(() => {
		disableBackdropClose.value = listMutation.isPending;
	});

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'md', fullHeight: true })}>
				<fieldset disabled={listMutation.isPending} class="contents">
					<div class={/* @once */ DialogHeader({ divider: true })}>
						<button
							title="Close dialog"
							onClick={closeModal}
							class={/* @once */ IconButton({ edge: 'left' })}
						>
							<CloseIcon />
						</button>

						<h1 class={/* @once */ DialogTitle()}>Add to list</h1>

						<button
							disabled={isEqual()}
							onClick={() => {
								listMutation.mutate();
							}}
							class={/* @once */ Button({ variant: 'primary', size: 'xs' })}
						>
							Save
						</button>
					</div>

					<div class={/* @once */ DialogBody({ padded: false, scrollable: true, class: 'flex flex-col' })}>
						{multiagent.accounts.length > 1 && (
							<div class="p-4 pb-1">
								<FilterBar
									value={uid()}
									onChange={setUid}
									items={multiagent.accounts.map((account) => ({
										value: account.did,
										get label() {
											return `${renderAccountName(account)}'s lists`;
										},
									}))}
								/>
							</div>
						)}

						<For each={lists.data?.pages.flatMap((page) => page.lists)}>
							{(list) => {
								const listUri = list.uri;
								const index = createMemo(() => listUris().indexOf(listUri));

								return (
									<button
										disabled={!memberships.data}
										aria-pressed={index() !== -1}
										onClick={() => {
											const $index = index();
											const $listUris = listUris();

											if ($index === -1) {
												setListUris([...$listUris, listUri]);
											} else {
												setListUris($listUris.toSpliced($index, 1));
											}
										}}
										class={listItem}
									>
										<img src={list.avatar.value || DefaultListAvatar} class="h-9 w-9 shrink-0 rounded-md" />

										<div class="min-w-0 grow">
											<p class="break-words text-sm font-bold">{list.name.value}</p>
											<p class="text-sm text-muted-fg">{renderListPurpose(list.purpose.value)}</p>
										</div>

										<CheckIcon class={clsx([`text-xl text-accent`, index() === -1 && `invisible`])} />
									</button>
								);
							}}
						</For>

						{(() => {
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
											if (lists.isLoadingError) {
												lists.refetch();
											} else {
												lists.fetchNextPage();
											}
										}}
									/>
								);
							}

							if (lists.hasNextPage) {
								return (
									<button onClick={() => lists.fetchNextPage()} class={loadMoreBtn}>
										Show more lists
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
				</fieldset>
			</div>
		</DialogOverlay>
	);
};

export default AddProfileInListDialog;
