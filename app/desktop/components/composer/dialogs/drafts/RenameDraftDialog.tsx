import { createSignal } from 'solid-js';

import { closeModal } from '~/com/globals/modals';

import { model } from '~/utils/input';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';
import { Button } from '~/com/primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { Input } from '~/com/primitives/input';

import { getDraftDb, type ComposerDraft } from '../../utils/draft-db';

export interface SaveDraftDialogProps {
	draft: ComposerDraft;
	onSave: (next: ComposerDraft) => void;
}

const RenameDraftDialog = (props: SaveDraftDialogProps) => {
	const draft = props.draft;

	const originalName = draft.title;
	const [name, setName] = createSignal(originalName);

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();
		closeModal();

		const $name = name().trim();
		if ($name === originalName) {
			return;
		}

		const next = { ...draft, title: $name };
		const dbp = getDraftDb();

		dbp.then((db) => db.put('drafts', next, draft.id)).then(() => props.onSave(next));
	};

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Rename draft</h1>
				</div>

				<div class={/* @once */ DialogBody({ class: 'flex flex-col gap-4', scrollable: true })}>
					<label class="block">
						<span class="mb-2 block text-sm font-medium leading-6 text-primary">Name</span>
						<input
							ref={model(name, setName)}
							type="text"
							required
							pattern=".*\S+.*"
							class={/* @once */ Input()}
						/>
					</label>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button type="button" onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>

					<button type="submit" class={/* @once */ Button({ variant: 'primary' })}>
						Save
					</button>
				</div>
			</form>
		</DialogOverlay>
	);
};

export default RenameDraftDialog;
