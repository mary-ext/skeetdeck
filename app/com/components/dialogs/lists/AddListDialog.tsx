import { createEffect, createMemo, createSignal } from 'solid-js';

import { createMutation } from '@pkg/solid-query';

import type { DID, Records, RefOf } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';
import { getCurrentDate } from '~/api/utils/misc.ts';
import { ListPurposeLabels } from '~/api/display.ts';

import { uploadBlob } from '~/api/mutations/upload-blob.ts';

import { finalizeRt, getRtLength, parseRt } from '~/api/richtext/composer.ts';

import { model } from '~/utils/input.ts';
import { clsx } from '~/utils/misc.ts';

import { closeModal, useModalState } from '../../../globals/modals.tsx';

import { Button } from '../../../primitives/button.ts';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../../primitives/dialog.ts';
import { IconButton } from '../../../primitives/icon-button.ts';
import { Input } from '../../../primitives/input.ts';

import AddPhotoButton from '../../inputs/AddPhotoButton.tsx';
import SelectInput from '../../inputs/SelectInput.tsx';
import RichtextComposer from '../../richtext/RichtextComposer.tsx';
import BlobImage from '../../BlobImage.tsx';
import DialogOverlay from '../DialogOverlay.tsx';

import CloseIcon from '../../../icons/baseline-close.tsx';

type ListPurpose = RefOf<'app.bsky.graph.defs#listPurpose'>;
type ListRecord = Records['app.bsky.graph.list'];

export interface AddListDialogProps {
	uid: DID;
	type?: ListPurpose;
	onSubmit?: (uri: string) => void;
}

const MAX_DESC_LENGTH = 300;

const AddListDialog = (props: AddListDialogProps) => {
	const uid = props.uid;
	const onSubmit = props.onSubmit;

	const { close, disableBackdropClose } = useModalState();

	const [avatar, setAvatar] = createSignal<Blob>();
	const [name, setName] = createSignal<string>('');
	const [purpose, setPurpose] = createSignal<ListPurpose>(props.type ?? 'app.bsky.graph.defs#curatelist');

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

			const record: ListRecord = {
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

						<h1 class={/* @once */ DialogTitle()}>New list</h1>

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
