import { batch, createSignal } from 'solid-js';

import { model } from '~/utils/input.ts';

import { closeModal, openModal } from '~/com/globals/modals.tsx';
import type { DeckConfig } from '~/desktop/globals/panes.ts';

import { Button } from '~/com/primitives/button.ts';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { Input } from '~/com/primitives/input.ts';
import { Interactive } from '~/com/primitives/interactive.ts';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog.tsx';
import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';
import EmojiFlyout from '~/com/components/emojis/EmojiFlyout.tsx';

import ChevronRightIcon from '~/com/icons/baseline-chevron-right.tsx';
import CloseIcon from '~/com/icons/baseline-close.tsx';

export interface EditDeckDialogProps {
	/** Expected to be static */
	deck: DeckConfig;
	onRemove: () => void;
}

const EditDeckDialog = (props: EditDeckDialogProps) => {
	const deck = props.deck;

	const [name, setName] = createSignal(deck.name);
	const [emoji, setEmoji] = createSignal(deck.emoji);

	const handleSubmit = (ev: SubmitEvent) => {
		const $name = name();
		const $emoji = emoji();

		ev.preventDefault();
		closeModal();

		batch(() => {
			deck.name = $name;
			deck.emoji = $emoji;
		});
	};

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'md', fullHeight: true })}>
				<div class={/* @once */ DialogHeader({ divider: true })}>
					<button type="button" onClick={closeModal} class={/* @once */ IconButton({ edge: 'left' })}>
						<CloseIcon />
					</button>

					<h1 class={/* @once */ DialogTitle()}>Edit deck</h1>

					<button type="submit" class={/* @once */ Button({ variant: 'primary', size: 'xs' })}>
						Save
					</button>
				</div>

				<div class={/* @once */ DialogBody({ class: 'flex flex-col', scrollable: true, padded: false })}>
					<div class="mt-4 flex flex-col gap-2 px-4">
						<label for="name" class="block text-sm font-medium leading-6 text-primary">
							Name
						</label>
						<input ref={model(name, setName)} type="text" id="name" required class={/* @once */ Input()} />
					</div>

					<div class="mt-4 flex flex-col gap-2 px-4">
						<label class="block text-sm font-medium leading-6 text-primary">Emoji</label>

						<div class="flex min-w-0 flex-wrap items-center gap-4 pb-0.5">
							<EmojiFlyout onPick={(emoji) => setEmoji(emoji.picked)}>
								<button
									type="button"
									class="flex h-9 items-center gap-2 self-start rounded border border-input px-3 py-2 outline-2 -outline-offset-1 outline-accent outline-none focus:outline disabled:opacity-50"
								>
									<span class="text-lg">{emoji()}</span>
									<ChevronRightIcon class="-mr-2 rotate-90 text-base text-muted-fg" />
								</button>
							</EmojiFlyout>

							<span class="text-sm text-muted-fg">Choose an emoji for your deck</span>
						</div>
					</div>

					<hr class="mt-auto border-divider" />

					<button
						type="button"
						onClick={() => {
							openModal(() => (
								<ConfirmDialog
									title={`Delete deck?`}
									body={`This can't be undone, this deck will be deleted.`}
									confirmation="Delete"
									onConfirm={() => {
										closeModal();
										props.onRemove();
									}}
								/>
							));
						}}
						class={/* @once */ Interactive({ variant: 'danger', class: `p-4 text-sm text-red-500` })}
					>
						Delete deck
					</button>
				</div>
			</form>
		</DialogOverlay>
	);
};

export default EditDeckDialog;
