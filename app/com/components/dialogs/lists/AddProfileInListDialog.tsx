import type { SignalizedProfile } from '~/api/stores/profiles';

import { closeModal } from '../../../globals/modals';

import DialogOverlay from '../DialogOverlay';

import { DialogActions, DialogHeader, DialogRoot, DialogTitle } from '../../../primitives/dialog';
import { Button } from '../../../primitives/button';

export interface AddProfileInListDialogProps {
	/** Expected to be static */
	profile: SignalizedProfile;
}

const AddProfileInListDialog = ({}: AddProfileInListDialogProps) => {
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

export default AddProfileInListDialog;
