import { createSignal } from 'solid-js';

import { createMutation, useQueryClient } from '@pkg/solid-query';

import type { DID, Records } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';
import { getCurrentDate, getRecordId } from '~/api/utils/misc.ts';

import { uploadBlob } from '~/api/mutations/upload-blob.ts';
import type { SignalizedList } from '~/api/stores/lists.ts';
import { getListInfoKey } from '~/api/queries/get-list-info.ts';

import { model } from '~/utils/input.ts';

import { openModal, useModalState } from '~/com/globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { Input } from '~/com/primitives/input.ts';
import { Interactive } from '~/com/primitives/interactive.ts';
import { Select } from '~/com/primitives/select.ts';
import { Textarea } from '~/com/primitives/textarea.ts';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';
import BlobImage from '~/com/components/BlobImage.tsx';

import CloseIcon from '~/com/icons/baseline-close.tsx';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right.tsx';
import AddPhotoButton from '~/com/components/inputs/AddPhotoButton.tsx';

import ListMembersDialog from './ListMembersDialog.tsx';

export interface ListFormDialogProps {
	uid: DID;
	/** Expected to be static */
	list?: SignalizedList;
	onEdit?: () => void;
	onAdd?: (uri: string) => void;
	onDelete?: () => void;
}

const enum ListType {
	MODERATION = 'app.bsky.graph.defs#modlist',
	CURATION = 'app.bsky.graph.defs#curatelist',
}

const listRecordType = 'app.bsky.graph.list';

type ListRecord = Records[typeof listRecordType];

const ListFormDialog = (props: ListFormDialogProps) => {
	const { disableBackdropClose, close } = useModalState();

	const queryClient = useQueryClient();

	const lst = props.list;

	const [avatar, setAvatar] = createSignal<Blob | string | undefined>((lst && lst.avatar.value) || undefined);
	const [name, setName] = createSignal((lst && lst.name.value) || '');
	const [desc, setDesc] = createSignal((lst && lst.description.value) || '');
	const [type, setType] = createSignal<string>(lst ? lst.purpose.value : ListType.CURATION);

	const listMutation = createMutation(() => ({
		mutationFn: async () => {
			let prev: ListRecord | undefined;
			let swap: string | undefined;

			const uid = props.uid;

			const $avatar = avatar();
			const $name = name();
			const $description = desc();
			const $type = type() as ListType;

			const agent = await multiagent.connect(uid);

			if (lst) {
				const response = await agent.rpc.get('com.atproto.repo.getRecord', {
					params: {
						repo: uid,
						collection: listRecordType,
						rkey: getRecordId(lst.uri),
					},
				});

				const data = response.data;

				prev = data.value as any;
				swap = data.cid;
			}

			const record: ListRecord = {
				createdAt: prev ? prev.createdAt : getCurrentDate(),
				avatar:
					$avatar === undefined
						? undefined
						: $avatar instanceof Blob
						  ? (($avatar as any).$blob ||= await uploadBlob(uid, $avatar))
						  : prev?.avatar,
				purpose: $type,
				name: $name,
				description: $description,
				descriptionFacets: undefined,
				labels: prev?.labels,
			};

			if (lst) {
				await agent.rpc.call('com.atproto.repo.putRecord', {
					data: {
						repo: uid,
						collection: listRecordType,
						rkey: getRecordId(lst.uri),
						swapRecord: swap,
						record: record,
					},
				});

				await queryClient.invalidateQueries({
					queryKey: getListInfoKey(props.uid, lst.uri),
				});
			} else {
				const response = await agent.rpc.call('com.atproto.repo.createRecord', {
					data: {
						repo: uid,
						collection: listRecordType,
						record: record,
					},
				});

				return response.data;
			}
		},
		onSuccess: (data) => {
			close();

			if (data) {
				props.onAdd?.(data.uri);
			} else {
				props.onEdit?.();
			}
		},
	}));

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();
		listMutation.mutate();
	};

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'md' })}>
				<fieldset disabled={(disableBackdropClose.value = listMutation.isPending)} class="contents">
					<div class={/* @once */ DialogHeader({ divider: true })}>
						<button type="button" onClick={close} class={/* @once */ IconButton({ edge: 'left' })}>
							<CloseIcon />
						</button>

						<h1 class={/* @once */ DialogTitle()}>Edit list</h1>

						<button type="submit" class={/* @once */ Button({ variant: 'primary', size: 'xs' })}>
							Save
						</button>
					</div>

					{(() => {
						const error = listMutation.error;

						if (error) {
							return (
								<div title={'' + error} class="shrink-0 bg-red-500 px-4 py-3 text-sm text-white">
									Something went wrong, try again later.
								</div>
							);
						}
					})()}

					<div class={/* @once */ DialogBody({ class: 'flex flex-col', scrollable: true, padded: false })}>
						<div class="relative aspect-banner bg-muted-fg">
							{(() => {
								const $avatar = avatar();

								if ($avatar) {
									return <BlobImage src={$avatar} class="aspect-banner h-full w-full object-cover" />;
								}
							})()}

							<AddPhotoButton
								exists={!!avatar()}
								title="Add banner image"
								// We're dealing with a square avatar pretending to be a banner
								aspectRatio={1 / 1}
								maxWidth={1000}
								maxHeight={1000}
								onPick={setAvatar}
							/>
						</div>

						{!lst && (
							<div class="mt-4 flex flex-col gap-2 px-4">
								<label for={'type'} class="block text-sm font-medium leading-6 text-primary">
									List purpose
								</label>

								<select
									id={'type'}
									class={/* @once */ Select()}
									value={type()}
									onChange={(ev) => setType(ev.currentTarget.value)}
								>
									<option value={ListType.MODERATION}>Moderation list</option>
									<option value={ListType.CURATION}>Curation list</option>
								</select>
							</div>
						)}

						<div class="mt-4 flex flex-col gap-2 px-4">
							<label for="name" class="block text-sm font-medium leading-6 text-primary">
								Name
							</label>
							<input ref={model(name, setName)} type="text" id="name" required class={/* @once */ Input()} />
						</div>

						<div class="mt-4 flex flex-col gap-2 px-4">
							<label
								for="description"
								class="flex items-center justify-between gap-2 text-sm font-medium leading-6 text-primary"
							>
								<span>Description</span>
								<span class="text-xs font-normal text-muted-fg">{desc().length}/300</span>
							</label>
							<textarea ref={model(desc, setDesc)} id="description" class={/* @once */ Textarea()} rows={4} />
						</div>

						<div class="grow"></div>

						{lst && (
							<div class="mt-4 flex flex-col border-t border-divider">
								<button
									type="button"
									onClick={() => {
										openModal(() => <ListMembersDialog list={lst} />);
									}}
									class={
										/* @once */ Interactive({
											class: `flex items-center justify-between gap-2 px-4 py-3 text-sm`,
										})
									}
								>
									<span>Manage members</span>
									<ChevronRightIcon class="-mr-2 text-2xl text-muted-fg" />
								</button>

								<button
									type="button"
									onClick={() => {}}
									class={/* @once */ Interactive({ variant: 'danger', class: `p-4 text-sm text-red-500` })}
								>
									Delete list
								</button>
							</div>
						)}
					</div>
				</fieldset>
			</form>
		</DialogOverlay>
	);
};

export default ListFormDialog;
