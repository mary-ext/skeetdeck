import type { SignalizedList } from '~/api/stores/lists';

import { closeModal } from '../../../globals/modals';
import { Button } from '../../../primitives/button';
import { DialogActions, DialogHeader, DialogRoot, DialogTitle } from '../../../primitives/dialog';
import DialogOverlay from '../DialogOverlay';

export interface CloneListMembersDialogProps {
	/** Expected to be static */
	list: SignalizedList;
}

const CloneListMembersDialog = ({}: CloneListMembersDialogProps) => {
	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Unimplemented</h1>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Dismiss
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default CloneListMembersDialog;
