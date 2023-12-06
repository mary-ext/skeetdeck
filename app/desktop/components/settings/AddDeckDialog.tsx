import { createSignal } from 'solid-js';

import { useNavigate } from '@solidjs/router';

import { preferences } from '../../globals/settings.ts';

import { getCurrentTid } from '~/api/utils/tid.ts';

import { closeModal } from '~/com/globals/modals.tsx';
import { model } from '~/utils/input.ts';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';
import EmojiFlyout from '~/com/components/emojis/EmojiFlyout.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { Input } from '~/com/primitives/input.ts';

import ChevronRightIcon from '~/com/icons/baseline-chevron-right.tsx';

const AddDeckDialog = () => {
	const navigate = useNavigate();

	const [name, setName] = createSignal('');
	const [emoji, setEmoji] = createSignal('⭐');

	const handleSubmit = (ev: SubmitEvent) => {
		const tid = getCurrentTid();

		const $name = name();
		const $emoji = emoji();

		ev.preventDefault();

		preferences.decks.push({
			id: tid,
			name: $name,
			emoji: $emoji,
			panes: [],
		});

		closeModal();
		navigate(`/decks/${tid}`, { replace: true });
	};

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Add new deck</h1>
				</div>

				<div class={/* @once */ DialogBody({ class: 'flex flex-col gap-4', scrollable: true })}>
					<label class="block">
						<span class="mb-2 block text-sm font-medium leading-6 text-primary">Name</span>
						<input ref={model(name, setName)} type="text" required class={/* @once */ Input()} />
					</label>

					<div class="flex flex-col gap-2">
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
				</div>

				<div class={/* @once */ DialogActions()}>
					<button type="button" onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>

					<button type="submit" class={/* @once */ Button({ variant: 'primary' })}>
						Add
					</button>
				</div>
			</form>
		</DialogOverlay>
	);
};

export default AddDeckDialog;
