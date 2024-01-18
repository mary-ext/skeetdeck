import { createMemo, createSignal as signal } from 'solid-js';

import { createMutation, useQueryClient } from '@pkg/solid-query';

import type { Records } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';
import { getRecordId } from '~/api/utils/misc.ts';

import { uploadBlob } from '~/api/mutations/upload-blob.ts';
import { getListInfoKey } from '~/api/queries/get-list-info.ts';
import type { SignalizedList } from '~/api/stores/lists.ts';

import { finalizeRt, getRtLength, parseRt } from '~/api/richtext/composer.ts';
import { serializeRichText } from '~/api/richtext/utils.ts';

import { model } from '~/utils/input.ts';
import { clsx } from '~/utils/misc.ts';

import { Button } from '~/com/primitives/button.ts';
import { Input } from '~/com/primitives/input.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import RichtextComposer from '~/com/components/richtext/RichtextComposer.tsx';

import AddPhotoButton from '~/com/components/inputs/AddPhotoButton.tsx';
import BlobImage from '~/com/components/BlobImage.tsx';

import ChevronRightIcon from '~/com/icons/baseline-chevron-right.tsx';

import { usePaneContext, usePaneModalState } from '../PaneContext.tsx';
import PaneDialog from '../PaneDialog.tsx';
import PaneDialogHeader from '../PaneDialogHeader.tsx';

import ListMembersPaneDialog from './ListMembersPaneDialog.tsx';

export interface ListSettingsPaneDialogProps {
	/** Expected to be static */
	list: SignalizedList;
}

const listRecordType = 'app.bsky.graph.list';

type ListRecord = Records[typeof listRecordType];

const MAX_DESC_LENGTH = 300;

const serializeListDescription = (list: SignalizedList) => {
	return serializeRichText(list.description.value || '', list.descriptionFacets.value, false);
};

const ListSettingsPaneDialog = (props: ListSettingsPaneDialogProps) => {
	const queryClient = useQueryClient();

	const { openModal: openPaneModal } = usePaneContext();
	const { disableBackdropClose, close } = usePaneModalState();

	const list = props.list;

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

			const uid = list.uid;

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
						rkey: getRecordId(list.uri),
						swapRecord: swap,
						record: prev,
					},
				});

				await queryClient.invalidateQueries({
					queryKey: getListInfoKey(list.uid, list.uri),
				});
			}
		},
		onSuccess: () => {
			close();
		},
	}));

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();
		listMutation.mutate();
	};

	return (
		<PaneDialog>
			<form onSubmit={handleSubmit} class="contents">
				<PaneDialogHeader title="Edit list" disabled={(disableBackdropClose.value = listMutation.isPending)}>
					<button type="submit" class={/* @once */ Button({ variant: 'primary', size: 'xs' })}>
						Save
					</button>
				</PaneDialogHeader>

				{(() => {
					const error = false;

					if (error) {
						return (
							<div title={'' + error} class="shrink-0 bg-red-500 px-4 py-3 text-sm text-white">
								Something went wrong, try again later.
							</div>
						);
					}
				})()}

				<fieldset disabled={listMutation.isPending} class="flex min-h-0 grow flex-col overflow-y-auto">
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
						disabled
						type="button"
						onClick={() => {}}
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
