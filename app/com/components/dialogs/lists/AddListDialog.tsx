import { createEffect, createMemo, createSignal } from 'solid-js';

import { createMutation } from '@externdefs/solid-query';

import type { AppBskyGraphDefs, AppBskyGraphList, At } from '~/api/atp-schema';
import { getAccountHandle, multiagent } from '~/api/globals/agent';
import { getCurrentDate } from '~/api/utils/misc';
import { ListPurposeLabels } from '~/api/display';

import { uploadBlob } from '~/api/mutations/upload-blob';

import { finalizeRt, getRtLength, parseRt } from '~/api/richtext/composer';

import { model } from '~/utils/input';
import { clsx } from '~/utils/misc';

import { closeModal, useModalState } from '../../../globals/modals';

import { Button } from '../../../primitives/button';
import { DialogBody, DialogHeader, DialogRoot } from '../../../primitives/dialog';
import { IconButton } from '../../../primitives/icon-button';
import { Input } from '../../../primitives/input';

import AddPhotoButton from '../../inputs/AddPhotoButton';
import SelectInput from '../../inputs/SelectInput';
import RichtextComposer from '../../richtext/RichtextComposer';
import BlobImage from '../../BlobImage';
import DialogOverlay from '../DialogOverlay';

import CloseIcon from '../../../icons/baseline-close';

type ListPurpose = AppBskyGraphDefs.ListPurpose;

export interface AddListDialogProps {
	uid: At.DID;
	type?: ListPurpose;
	onSubmit?: (uri: string) => void;
}

const MAX_DESC_LENGTH = 300;

const DIALOG_TITLES: Record<ListPurpose, string> = {
	'app.bsky.graph.defs#curatelist': 'New user list',
	'app.bsky.graph.defs#modlist': 'New moderation list',
};

const AddListDialog = (props: AddListDialogProps) => {
	const uid = props.uid;
	const onSubmit = props.onSubmit;

	const initialType = props.type;

	const { close, disableBackdropClose } = useModalState();

	const [avatar, setAvatar] = createSignal<Blob>();
	const [name, setName] = createSignal<string>('');
	const [purpose, setPurpose] = createSignal<ListPurpose>(initialType ?? 'app.bsky.graph.defs#curatelist');

	const [description, setDescription] = createSignal('');

	const richtext = createMemo(() => parseRt(description()));
	const length = () => getRtLength(richtext());

	const isDescriptionOver = createMemo(() => length() > MAX_DESC_LENGTH);

	const listMutation = createMutation(() => ({
		mutationFn: async () => {
			const $avatar = avatar();
			const $name = name();
			const $purpose = purpose();

			const $richtext = richtext();

			const { text, facets } = await finalizeRt(uid, $richtext);

			const record: AppBskyGraphList.Record = {
				createdAt: getCurrentDate(),
				name: $name,
				purpose: $purpose,
				description: text,
				descriptionFacets: facets,
				avatar: $avatar ? await uploadBlob(uid, $avatar) : undefined,
			};

			const agent = await multiagent.connect(uid);

			const response = await agent.rpc.call('com.atproto.repo.createRecord', {
				data: {
					repo: uid,
					collection: 'app.bsky.graph.list',
					record: record,
				},
			});

			return response.data;
		},
		onSuccess: ({ uri }: { uri: string }) => {
			close();

			if (onSubmit) {
				onSubmit(uri);
			}
		},
	}));

	const handleSubmit = (ev?: SubmitEvent) => {
		ev?.preventDefault();

		if (isDescriptionOver()) {
			return;
		}

		listMutation.mutate();
	};

	createEffect(() => {
		disableBackdropClose.value = listMutation.isPending;
	});

	return (
		<DialogOverlay>
			<form
				onSubmit={handleSubmit}
				class={/* @once */ DialogRoot({ size: 'sm', maxHeight: 'sm', fullHeight: true })}
			>
				<fieldset disabled={disableBackdropClose.value} class="contents">
					<div class={/* @once */ DialogHeader({ divider: true })}>
						<button
							title="Close dialog"
							type="button"
							onClick={closeModal}
							class={/* @once */ IconButton({ edge: 'left' })}
						>
							<CloseIcon />
						</button>

						<div class="flex min-w-0 grow flex-col gap-0.5">
							<p class="overflow-hidden text-ellipsis whitespace-nowrap text-base font-bold leading-5">
								{/* @once */ (initialType !== undefined && DIALOG_TITLES[initialType]) || `New list`}
							</p>
							<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
								{/* @once */ '@' + getAccountHandle(uid)}
							</p>
						</div>

						<button
							disabled={isDescriptionOver()}
							type="submit"
							class={/* @once */ Button({ variant: 'primary', size: 'xs' })}
						>
							Save
						</button>
					</div>

					<div class={/* @once */ DialogBody({ class: 'flex flex-col', scrollable: true, padded: false })}>
						<div class="relative mx-4 mt-4 aspect-square h-24 w-24 shrink-0 overflow-hidden rounded-md bg-muted-fg">
							<BlobImage src={avatar()} class="h-full w-full object-cover" />

							<AddPhotoButton
								exists={!!avatar()}
								title="Add avatar image"
								maxWidth={1000}
								maxHeight={1000}
								onPick={setAvatar}
							/>
						</div>

						{
							/* @once */ props.type === undefined && (
								<label class="mt-4 block px-4">
									<span class="mb-2 block text-sm font-medium leading-6 text-primary">Purpose</span>
									<SelectInput
										value={purpose()}
										onChange={setPurpose}
										options={
											/* @once */ Object.entries(ListPurposeLabels).map(([purpose, label]) => ({
												value: purpose,
												label: label,
											}))
										}
									/>
								</label>
							)
						}

						<label class="mt-4 block px-4">
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
								uid={uid}
								value={description()}
								rt={richtext()}
								onChange={setDescription}
								onSubmit={handleSubmit}
								minRows={4}
							/>
						</label>
					</div>
				</fieldset>
			</form>
		</DialogOverlay>
	);
};

export default AddListDialog;
