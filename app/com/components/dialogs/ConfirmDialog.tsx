import type { JSX } from 'solid-js/jsx-runtime';

import { closeModal } from '~/com/globals/modals.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';

import DialogOverlay from './DialogOverlay.tsx';

export interface ConfirmDialogProps {
	title: string;
	body: JSX.Element;
	confirmation: string;
	onConfirm: () => void;
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>{props.title}</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true })}>
					<p class="text-sm">{props.body}</p>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>
					<button
						onClick={() => {
							closeModal();
							props.onConfirm();
						}}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						{props.confirmation}
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default ConfirmDialog;
