import { onMount } from 'solid-js';

import { closeModal } from '~/com/globals/modals';

import { Button } from '~/com/primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';

export interface ImageAltReminderDialogProps {
	onIgnore: () => void;
}

const ImageAltReminderDialog = (props: ImageAltReminderDialogProps) => {
	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Don't forget to make your image accessible</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-2' })}>
					<p class="text-sm">
						Providing descriptions to your images makes Bluesky accessible to people with disabilities, and
						everyone who wants more context.
					</p>

					<p class="text-sm">You can turn off this reminder in Accessibility settings.</p>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button
						onClick={() => {
							closeModal();
							props.onIgnore();
						}}
						class={/* @once */ Button({ variant: 'ghost' })}
					>
						Not this time
					</button>

					<button
						ref={(node) => {
							onMount(() => {
								node.focus();
							});
						}}
						onClick={closeModal}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						Add description
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default ImageAltReminderDialog;
