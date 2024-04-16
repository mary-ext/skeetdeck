import { createEffect, createMemo, lazy, createSignal as signal } from 'solid-js';

import { type InfiniteData, createMutation, useQueryClient } from '@externdefs/solid-query';

import type { AppBskyGraphList, Brand, ComAtprotoRepoApplyWrites } from '~/api/atp-schema';
import { multiagent } from '~/api/globals/agent';
import { formatQueryError, getRecordId } from '~/api/utils/misc';

import { uploadBlob } from '~/api/mutations/upload-blob';
import { getListInfoKey } from '~/api/queries/get-list-info';
import {
	type ListMembership,
	getListMemberships,
	getListMembershipsKey,
	listMembershipsOptions,
} from '~/api/queries/get-list-memberships';
import { type SignalizedList, removeCachedList } from '~/api/stores/lists';

import { finalizeRt, getRtLength, parseRt } from '~/api/richtext/composer';
import { serializeRichText } from '~/api/richtext/utils';

import { model } from '~/utils/input';
import { chunked, clsx, mapDefined } from '~/utils/misc';

import { openModal } from '~/com/globals/modals';

import { PANE_TYPE_LIST } from '../../../globals/panes';
import { preferences } from '../../../globals/settings';

import { Button } from '~/com/primitives/button';
import { Input } from '~/com/primitives/input';
import { Interactive } from '~/com/primitives/interactive';

import RichtextComposer from '~/com/components/richtext/RichtextComposer';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog';
import AddPhotoButton from '~/com/components/inputs/AddPhotoButton';
import BlobImage from '~/com/components/BlobImage';

import ChevronRightIcon from '~/com/icons/baseline-chevron-right';

import { usePaneContext, usePaneModalState } from '../PaneContext';
import PaneDialog from '../PaneDialog';
import PaneDialogHeader from '../PaneDialogHeader';

const ListMembersPaneDialog = lazy(() => import('./ListMembersPaneDialog'));

export interface ListSettingsPaneDialogProps {
	/** Expected to be static */
	list: SignalizedList;
}

const listRecordType = 'app.bsky.graph.list';

type ListRecord = AppBskyGraphList.Record;

const MAX_DESC_LENGTH = 300;

const serializeListDescription = (list: SignalizedList) => {
	return serializeRichText(list.description.value || '', list.descriptionFacets.value, false);
};

const ListSettingsPaneDialog = (props: ListSettingsPaneDialogProps) => {
	const queryClient = useQueryClient();

	const { openModal: openPaneModal } = usePaneContext();
	const { disableBackdropClose, close } = usePaneModalState();

	const list = props.list;

	const listUri = list.uri;
	const uid = list.uid;

	const [avatar, setAvatar] = signal<Blob | string | undefined>(list.avatar.value || undefined);
	const [name, setName] = signal(list.name.value || '');
	const [desc, setDesc] = signal(serializeListDescription(list));

	const rt = createMemo(() => parseRt(desc()));
	const length = () => getRtLength(rt());

	const isDescriptionOver = () => length() > MAX_DESC_LENGTH;

	const listMutation = createMutation(() => ({
		mutationFn: async () => {
			let prev: ListRecord;
			let swap: string | undefined;

			const $avatar = avatar();
			const $name = name();
			const $rt = rt();

			const agent = await multiagent.connect(uid);

			// 1. Retrieve the actual record to replace
			{
				const response = await agent.rpc.get('com.atproto.repo.getRecord', {
					params: {
						repo: uid,
						collection: listRecordType,
						rkey: getRecordId(list.uri),
					},
				});

				const data = response.data;

				prev = data.value as any;
				swap = data.cid;
			}

			// 2. Merge our changes
			{
				const { text, facets } = await finalizeRt(uid, $rt);

				prev.avatar =
					$avatar === undefined
						? undefined
						: $avatar instanceof Blob
							? await uploadBlob(uid, $avatar)
							: prev.avatar;

				prev.name = $name;
				prev.description = text;
				prev.descriptionFacets = facets;

				await agent.rpc.call('com.atproto.repo.putRecord', {
					data: {
						repo: uid,
						collection: listRecordType,
						rkey: getRecordId(listUri),
						swapRecord: swap,
						record: prev,
					},
				});

				await queryClient.invalidateQueries({
					queryKey: getListInfoKey(uid, listUri),
				});
			}
		},
		onSuccess: () => {
			close();
		},
	}));

	const listDeleteMutation = createMutation(() => ({
		mutationFn: async () => {
			const memberships = await queryClient.fetchQuery({
				queryKey: getListMembershipsKey(uid),
				queryFn: getListMemberships,
				...listMembershipsOptions,
			});

			const agent = await multiagent.connect(uid);

			// 1. Remove all list items first
			{
				const itemUris = mapDefined(memberships, (x) => {
					return x.listUri === listUri ? x.itemUri : undefined;
				});

				const writes = itemUris.map((uri): Brand.Union<ComAtprotoRepoApplyWrites.Delete> => {
					return {
						$type: 'com.atproto.repo.applyWrites#delete',
						collection: 'app.bsky.graph.listitem',
						rkey: getRecordId(uri),
					};
				});

				const promises = chunked(writes, 100).map((chunk) => {
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
						queryKey: ['getListMembers', uid, listUri],
					});

					throw err;
				}
			}

			// 2. Remove the list
			{
				await agent.rpc.call('com.atproto.repo.deleteRecord', {
					data: {
						repo: uid,
						collection: 'app.bsky.graph.list',
						rkey: getRecordId(listUri),
					},
				});
			}
		},
		onSuccess: async () => {
			close();

			// 1. Remove all columns with this list
			const decks = preferences.decks;
			for (let i = 0, il = decks.length; i < il; i++) {
				const deck = decks[i];
				const panes = deck.panes;

				for (let j = panes.length - 1; j >= 0; j--) {
					const pane = panes[j];

					if (pane.type === PANE_TYPE_LIST && pane.list.uri === listUri) {
						panes.splice(j, 1);
					}
				}
			}

			// 2. Update memberships data
			queryClient.setQueryData<ListMembership[]>(getListMembershipsKey(uid), (prev) => {
				if (prev) {
					return prev.filter((x) => x.listUri !== listUri);
				}

				return prev;
			});

			// 3. Remove cached list
			removeCachedList(uid, listUri);

			// 4. Reset any queries showing the list info
			queryClient.resetQueries({
				exact: true,
				queryKey: getListInfoKey(uid, listUri),
			});

			// 5. Remove list from listing
			{
				const { produce } = await import('~/utils/immer.ts');

				queryClient.setQueriesData<InfiniteData<{ lists: SignalizedList[] }>>(
					{ queryKey: ['getProfileLists', uid, uid] },
					(prev) => {
						if (prev) {
							return produce(prev, (data) => {
								const pages = data.pages;
								for (let i = 0, il = pages.length; i < il; i++) {
									const page = pages[i];
									const lists = page.lists;

									for (let j = 0, jl = lists.length; j < jl; j++) {
										const list = lists[j];

										if (list.uri === listUri) {
											lists.splice(j, 1);
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
		},
	}));

	const handleSubmit = (ev?: Event) => {
		ev?.preventDefault();

		if (isDescriptionOver()) {
			return;
		}

		listDeleteMutation.reset();
		listMutation.mutate();
	};

	const handleDelete = () => {
		listMutation.reset();
		listDeleteMutation.mutate();
	};

	createEffect(() => {
		disableBackdropClose.value = listMutation.isPending || listDeleteMutation.isPending;
	});

	return (
		<PaneDialog>
			<form onSubmit={handleSubmit} class="contents">
				<PaneDialogHeader title="Edit list" disabled={disableBackdropClose.value}>
					<button
						type="submit"
						disabled={isDescriptionOver()}
						class={/* @once */ Button({ variant: 'primary', size: 'xs' })}
					>
						Save
					</button>
				</PaneDialogHeader>

				{(() => {
					if (listMutation.isError || listDeleteMutation.isError) {
						return (
							<div
								title={formatQueryError(listMutation.error || listDeleteMutation.error)}
								class="shrink-0 bg-red-500 px-4 py-3 text-sm text-white"
							>
								Something went wrong, try again later.
							</div>
						);
					}
				})()}

				<fieldset disabled={disableBackdropClose.value} class="flex min-h-0 grow flex-col overflow-y-auto">
					<div class="relative mx-4 mt-4 aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted-fg">
						{(() => {
							const $avatar = avatar();

							if ($avatar) {
								return <BlobImage src={$avatar} class="h-full w-full object-cover" />;
							}
						})()}

						<AddPhotoButton
							exists={!!avatar()}
							title="Add avatar image"
							maxWidth={1000}
							maxHeight={1000}
							onPick={setAvatar}
						/>
					</div>

					<label class="mx-4 mt-4 block">
						<span class="mb-2 block text-sm font-medium leading-6 text-primary">Name</span>
						<input ref={model(name, setName)} type="text" required class={/* @once */ Input()} />
					</label>

					<label class="mx-4 mt-4 block">
						<span class="mb-2 flex items-center justify-between gap-2 text-sm font-medium leading-6 text-primary">
							<span>Description</span>
							<span
								class={clsx([
									`text-xs`,
									!isDescriptionOver() ? `font-normal text-muted-fg` : `font-bold text-red-500`,
								])}
							>
								{length()}/{MAX_DESC_LENGTH}
							</span>
						</span>

						<RichtextComposer
							type="textarea"
							uid={list.uid}
							value={desc()}
							rt={rt()}
							onChange={setDesc}
							onSubmit={handleSubmit}
							minRows={4}
						/>
					</label>

					<div class="mt-4 grow border-b border-divider"></div>

					{(() => {
						if (list.purpose.value === 'app.bsky.graph.defs#modlist') {
							return;
						}

						return (
							<button
								type="button"
								onClick={() => {
									openPaneModal(() => <ListMembersPaneDialog list={list} />);
								}}
								class={
									/* @once */ Interactive({
										class: `flex items-center justify-between gap-2 px-4 py-3 text-sm disabled:opacity-50`,
									})
								}
							>
								<span>Manage members</span>
								<ChevronRightIcon class="-mr-2 text-2xl text-muted-fg" />
							</button>
						);
					})()}

					<button
						type="button"
						onClick={() => {
							openModal(() => (
								<ConfirmDialog
									title="Delete list?"
									body={
										<>
											<b>{list.name.value}</b> will be deleted, this can't be undone.
										</>
									}
									confirmation="Delete"
									onConfirm={handleDelete}
								/>
							));
						}}
						class={
							/* @once */ Interactive({
								variant: 'danger',
								class: `p-4 text-sm text-red-500 disabled:opacity-50`,
							})
						}
					>
						Delete list
					</button>
				</fieldset>
			</form>
		</PaneDialog>
	);
};

export default ListSettingsPaneDialog;
