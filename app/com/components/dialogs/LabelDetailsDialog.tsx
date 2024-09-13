import { type LabelModerationCause, type ModerationService, getLocalizedLabel } from '~/api/moderation';

import { closeModal } from '../../globals/modals';
import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog';
import { ListBox, ListBoxItem } from '../../primitives/list-box';

import DialogOverlay from './DialogOverlay';

export interface LabelDetailsDialogProps {
	cause: LabelModerationCause;
}

const LabelDetailsDialog = (props: LabelDetailsDialogProps) => {
	const cause = props.cause;

	const service = cause.s;
	const localized = getLocalizedLabel(cause.d);

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Label details</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-2' })}>
					<div class={ListBox}>
						<div class={ListBoxItem}>
							<div class="flex min-w-0 grow flex-col text-sm">
								<p class="overflow-hidden text-ellipsis font-bold empty:hidden">{/* @once */ localized.n}</p>
								<p class="overflow-hidden text-ellipsis text-de text-muted-fg">
									{/* @once */ localized.d || <i>No description provided</i>}
								</p>
							</div>
						</div>
					</div>

					{(() => {
						return (
							<div class="text-de text-muted-fg">
								<p>Applied by {service ? renderLabelSource(service) : `the author`}.</p>
							</div>
						);
					})()}
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

export default LabelDetailsDialog;

const renderLabelSource = (source: ModerationService) => {
	const profile = source.profile;

	if (profile) {
		return profile.displayName || `@${profile.handle}`;
	}

	return source.did;
};
