import type { JSX } from 'solid-js/jsx-runtime';

import { closeModal } from '../../globals/modals';

import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog';

import DialogOverlay from './DialogOverlay';

export interface ConfirmDialogProps {
	title: string;
	body: JSX.Element;
	confirmation: string;
	onConfirm: () => void;
	unwrap?: boolean;
}

const ConfirmDialog = (props: ConfirmDialogProps) => {
	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>{props.title}</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-4' })}>
					{props.unwrap ? props.body : <p class="text-sm">{props.body}</p>}
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
