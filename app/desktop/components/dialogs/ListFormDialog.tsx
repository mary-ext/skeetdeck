import { createEffect, createSignal } from 'solid-js';

import { createMutation } from '@pkg/solid-query';

import type { SignalizedList } from '~/api/stores/lists.ts';

import { model } from '~/utils/input.ts';

import { closeModal, useModalState } from '~/com/globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { Input } from '~/com/primitives/input.ts';
import { Interactive } from '~/com/primitives/interactive.ts';
import { Textarea } from '~/com/primitives/textarea.ts';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';
import BlobImage from '~/com/components/BlobImage.tsx';

import CloseIcon from '~/com/icons/baseline-close.tsx';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right.tsx';
import AddPhotoButton from '~/com/components/inputs/AddPhotoButton.tsx';

export interface ListFormDialogProps {
	/** Expected to be static */
	list?: SignalizedList;
	onAdd?: () => void;
	onDelete?: () => void;
}

const enum ListType {
	MODERATION = 'app.bsky.graph.defs#modlist',
	CURATION = 'app.bsky.graph.defs#curatelist',
}

const ListFormDialog = (props: ListFormDialogProps) => {
	const { disableBackdropClose } = useModalState();

	const lst = props.list;

	const [avatar, setAvatar] = createSignal<Blob | string | undefined>((lst && lst.avatar.value) || undefined);
	const [name, setName] = createSignal((lst && lst.name.value) || '');
	const [desc, setDesc] = createSignal((lst && lst.description.value) || '');
	const [type, setType] = createSignal<string>(lst ? lst.purpose.value : ListType.CURATION);

	const listMutation = createMutation(() => {
		return {
			mutationFn: async () => {},
		};
	});

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();
	};

	createEffect(() => {
		disableBackdropClose.value = listMutation.isPending;
	});

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'md' })}>
				<fieldset class="contents">
					<div class={/* @once */ DialogHeader({ divider: true })}>
						<button type="button" onClick={closeModal} class={/* @once */ IconButton({ edge: 'left' })}>
							<CloseIcon />
						</button>

						<h1 class={/* @once */ DialogTitle()}>Edit list</h1>

						<button type="submit" class={/* @once */ Button({ variant: 'primary', size: 'xs' })}>
							Save
						</button>
					</div>

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
									onClick={() => {}}
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
