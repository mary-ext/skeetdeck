import { batch, createSignal } from 'solid-js';

import { closeModal, openModal } from '~/com/globals/modals';

import type { DeckConfig } from '~/desktop/globals/panes';

import { model } from '~/utils/input';

import { Button } from '~/com/primitives/button';
import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { IconButton } from '~/com/primitives/icon-button';
import { Input } from '~/com/primitives/input';
import { Interactive } from '~/com/primitives/interactive';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog';
import DialogOverlay from '~/com/components/dialogs/DialogOverlay';
import EmojiFlyout from '~/com/components/emojis/EmojiFlyout';

import ChevronRightIcon from '~/com/icons/baseline-chevron-right';
import CloseIcon from '~/com/icons/baseline-close';

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
					<button
						title="Close dialog"
						type="button"
						onClick={closeModal}
						class={/* @once */ IconButton({ edge: 'left' })}
					>
						<CloseIcon />
					</button>

					<h1 class={/* @once */ DialogTitle()}>Edit deck</h1>

					<button type="submit" class={/* @once */ Button({ variant: 'primary', size: 'xs' })}>
						Save
					</button>
				</div>

				<div class={/* @once */ DialogBody({ class: 'flex flex-col', scrollable: true, padded: false })}>
					<label class="mt-4 block px-4">
						<span class="mb-2 block text-sm font-medium leading-6 text-primary">Name</span>
						<input ref={model(name, setName)} type="text" required class={/* @once */ Input()} />
					</label>

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
