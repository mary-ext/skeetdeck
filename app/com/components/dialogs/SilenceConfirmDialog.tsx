import { batch, createMemo, createSignal } from 'solid-js';

import { useQueryClient, type InfiniteData } from '@mary/solid-query';

import type { TimelinePage, getTimelineKey } from '~/api/queries/get-timeline';
import type { SignalizedProfile } from '~/api/stores/profiles';
import { produceTimelineFilter } from '~/api/updaters/timeline-filter';

import { isProfileTempMuted } from '~/api/moderation';

import { closeModal } from '../../globals/modals';
import { bustModeration, getModerationOptions } from '../../globals/shared';

import { Button } from '../../primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog';
import SelectInput from '../inputs/SelectInput';
import DialogOverlay from './DialogOverlay';

export interface SilenceConfirmDialogProps {
	profile: SignalizedProfile;
}

const SilenceConfirmDialog = (props: SilenceConfirmDialogProps) => {
	const queryClient = useQueryClient();

	const profile = props.profile;
	const did = profile.did;
	const uid = profile.uid;

	const [duration, setDuration] = createSignal(1 * 24 * 60 * 60 * 1_000);
	const silenced = createMemo(() => isProfileTempMuted(getModerationOptions(), did) !== null);

	const handleConfirm = () => {
		const tempMutes = getModerationOptions().tempMutes;

		closeModal();

		if (silenced()) {
			batch(() => {
				delete tempMutes[did];
				bustModeration();
			});
		} else {
			const $duration = duration();

			if (Number.isNaN($duration) || $duration < 1) {
				return;
			}

			const updateTimeline = produceTimelineFilter(did);

			batch(() => {
				tempMutes[did] = Date.now() + $duration;
				bustModeration();
			});

			queryClient.setQueriesData<InfiniteData<TimelinePage>>(
				{
					predicate: (query) => {
						const [t, u, p] = query.queryKey as ReturnType<typeof getTimelineKey>;

						// Do not try to filter user's own feed
						return t === 'getTimeline' && u === uid && (p.type !== 'profile' || p.actor !== did);
					},
				},
				(data) => {
					if (!data) {
						return data;
					}

					return updateTimeline(data);
				},
			);
		}
	};

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
										onChange={(next) => setDuration(+next)}
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
					<button onClick={handleConfirm} class={/* @once */ Button({ variant: 'primary' })}>
						{!silenced() ? `Silence` : `Unsilence`}
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default SilenceConfirmDialog;
