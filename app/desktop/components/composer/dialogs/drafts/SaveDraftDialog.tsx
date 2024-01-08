import { createSignal } from 'solid-js';

import { getCurrentTid } from '~/api/utils/tid.ts';

import { closeModal } from '~/com/globals/modals.tsx';

import { preferences } from '~/desktop/globals/settings.ts';

import { model, modelChecked } from '~/utils/input.ts';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';
import Checkbox from '~/com/components/inputs/Checkbox.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { Input } from '~/com/primitives/input.ts';

import { type GateState, useComposer, createComposerState } from '../../ComposerContext.tsx';
import { type ComposerDraft, getDraftDb } from '../../utils/draft-db.ts';

const serializeGateState = (state: GateState): GateState => {
	const type = state.type;

	if (type === 'c') {
		return { type: type, mentions: state.mentions, follows: state.follows, lists: [...state.lists] };
	}

	return { type: type };
};

export interface SaveDraftDialogProps {
	onSave: (draft: ComposerDraft) => void;
}

const SaveDraftDialog = (props: SaveDraftDialogProps) => {
	const context = useComposer();

	const [name, setName] = createSignal('Unnamed draft');
	const [clear, setClear] = createSignal(true);

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();
		closeModal();

		const shouldClear = clear();

		const state = context.state;
		const id = getCurrentTid();

		const serialized: ComposerDraft = {
			id: id,
			title: name().trim(),
			createdAt: Date.now(),
			author: context.author,
			state: {
				reply: state.reply,
				posts: state.posts.map((post) => {
					return {
						text: post.text,
						external: post.external,
						record: post.record,
						images: post.images.map((img) => {
							return {
								blob: img.blob,
								ratio: { ...img.ratio },
								alt: img.alt.peek(),
							};
						}),
						tags: [...post.tags],
						labels: [...post.labels],
						languages: [...post.languages],
					};
				}),
				gate: serializeGateState(state.gate),
			},
		};

		const dbp = getDraftDb();
		dbp
			.then((db) => db.add('drafts', serialized, id))
			.then(() => {
				if (shouldClear) {
					context.state = createComposerState(preferences);
				}

				props.onSave(serialized);
			});
	};

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Save as draft</h1>
				</div>

				<div class={/* @once */ DialogBody({ class: 'flex flex-col gap-4', scrollable: true })}>
					<label class="block">
						<span class="mb-2 block text-sm font-medium leading-6 text-primary">Name</span>
						<input
							ref={model(name, setName)}
							type="text"
							required
							pattern=".*\\S+.*"
							class={/* @once */ Input()}
						/>
					</label>

					<label class="flex items-center gap-3 py-2">
						<Checkbox ref={modelChecked(clear, setClear)} />
						<span class="text-sm">Clear the composer</span>
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

export default SaveDraftDialog;
