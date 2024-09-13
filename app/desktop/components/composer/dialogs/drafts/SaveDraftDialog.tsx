import { createSignal } from 'solid-js';

import * as TID from '@mary/atproto-tid';

import { closeModal } from '~/com/globals/modals';

import { model, modelChecked } from '~/utils/input';

import { Button } from '~/com/primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { Input } from '~/com/primitives/input';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';
import Checkbox from '~/com/components/inputs/Checkbox';

import { useComposer } from '../../ComposerContext';
import { type ComposerDraft, getDraftDb } from '../../utils/draft-db';
import type { GateState } from '../../utils/state';

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
	const composer = useComposer();

	const [name, setName] = createSignal('Unnamed draft');
	const [clear, setClear] = createSignal(true);

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();
		closeModal();

		const shouldClear = clear();

		const state = composer.state()!;
		const id = TID.now();

		const serialized: ComposerDraft = {
			id: id,
			title: name().trim(),
			createdAt: Date.now(),
			author: state.author,
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
					composer._reset();
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
							pattern=".*\S+.*"
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
