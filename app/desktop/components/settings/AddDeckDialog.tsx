import { createSignal } from 'solid-js';

import { useNavigate } from '@solidjs/router';

import { preferences } from '../../globals/settings.ts';

import { getCurrentTid } from '~/api/utils/tid.ts';

import { closeModal } from '~/com/globals/modals.tsx';
import { model } from '~/utils/input.ts';

import button from '~/com/primitives/button.ts';
import * as dialog from '~/com/primitives/dialog.ts';
import input from '~/com/primitives/input.ts';

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
		<form onSubmit={handleSubmit} class={/* @once */ dialog.root({ size: 'sm' })}>
			<div class={/* @once */ dialog.header()}>
				<h1 class={/* @once */ dialog.title()}>Add new deck</h1>
			</div>

			<div class={/* @once */ dialog.body({ class: 'flex flex-col gap-4' })}>
				<div class="flex flex-col gap-2">
					<label for="name" class="block text-sm font-medium leading-6 text-primary">
						Name
					</label>
					<input ref={model(name, setName)} type="text" id="name" required class={/* @once */ input()} />
				</div>
			</div>

			<div class={/* @once */ dialog.actions()}>
				<button type="button" onClick={closeModal} class={/* @once */ button({ variant: 'ghost' })}>
					Cancel
				</button>

				<button type="submit" class={/* @once */ button({ variant: 'primary' })}>
					Add
				</button>
			</div>
		</form>
	);
};

export default AddDeckDialog;
