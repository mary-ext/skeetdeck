import { createMemo, createSignal } from 'solid-js';

import type { SignalizedProfile } from '~/api/stores/profiles';

import { closeModal } from '../../globals/modals';

import DialogOverlay from './DialogOverlay';
import { isProfileTempMuted, useSharedPreferences } from '../SharedPreferences';

import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog';

import SelectInput from '../inputs/SelectInput';

export interface SilenceConfirmDialogProps {
	profile: SignalizedProfile;
}

const SilenceConfirmDialog = (props: SilenceConfirmDialogProps) => {
	const profile = props.profile;
	const did = profile.did;

	const { filters } = useSharedPreferences();

	const [duration, setDuration] = createSignal(1 * 24 * 60 * 60 * 1_000);
	const silenced = createMemo(() => isProfileTempMuted(filters, did) !== null);

	const handleConfirm = () => {};

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1
						class={/* @once */ DialogTitle()}
					>{`${!silenced() ? `Silence` : `Unsilence`} @${profile.handle.value}?`}</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-4' })}>
					<p class="text-sm">
						{(() => {
							return !silenced() ? (
								<>
									Their posts will be temporarily silenced from your timeline, but it will still allow them to
									see your posts and follow you.
								</>
							) : (
								<>Their posts will be allowed to show in your timeline.</>
							);
						})()}
					</p>

					{(() => {
						if (!silenced()) {
							return (
								<label>
									<span class="mr-4 text-sm">Duration:</span>
									<SelectInput
										value={'' + duration()}
										onChange={setDuration}
										options={[
											{ value: '' + 1 * 60 * 60 * 1_000, label: '1 hour' },
											{ value: '' + 6 * 60 * 60 * 1_000, label: '6 hour' },
											{ value: '' + 12 * 60 * 60 * 1_000, label: '12 hour' },
											{ value: '' + 1 * 24 * 60 * 60 * 1_000, label: '1 day' },
											{ value: '' + 3 * 24 * 60 * 60 * 1_000, label: '3 days' },
											{ value: '' + 7 * 24 * 60 * 60 * 1_000, label: '7 days' },
											{ value: '' + 14 * 24 * 60 * 60 * 1_000, label: '14 days' },
										]}
									/>
								</label>
							);
						}
					})()}

					<p class="text-sm text-muted-fg">Silenced users won't carry over to other devices.</p>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>
					<button
						onClick={() => {
							closeModal();
							handleConfirm();
						}}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						{!silenced() ? `Silence` : `Unsilence`}
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default SilenceConfirmDialog;
