import { createSignal } from 'solid-js';

import { useNavigate } from '@solidjs/router';

import { preferences } from '../../globals/settings.ts';

import { getCurrentTid } from '~/api/utils/tid.ts';

import { closeModal } from '~/com/globals/modals.tsx';
import { model } from '~/utils/input.ts';

import { Button } from '~/com/primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { Input } from '~/com/primitives/input.ts';

const AddDeckDialog = () => {
	const [name, setName] = createSignal('');
	const navigate = useNavigate();

	const handleSubmit = (ev: SubmitEvent) => {
		const tid = getCurrentTid();
		const $name = name();

		ev.preventDefault();

		preferences.decks.push({
			id: tid,
			name: $name,
			emoji: '⭐',
			panes: [],
		});

		closeModal();
		navigate(`/decks/${tid}`, { replace: true });
	};

	return (
		<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'sm' })}>
			<div class={/* @once */ DialogHeader()}>
				<h1 class={/* @once */ DialogTitle()}>Add new deck</h1>
			</div>

			<div class={/* @once */ DialogBody({ class: 'flex flex-col gap-4' })}>
				<div class="flex flex-col gap-2">
					<label for="name" class="block text-sm font-medium leading-6 text-primary">
						Name
					</label>
					<input ref={model(name, setName)} type="text" id="name" required class={/* @once */ Input()} />
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
	);
};

export default AddDeckDialog;
