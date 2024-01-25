import { type JSX, createSignal, createMemo, batch } from 'solid-js';

import { type InfiniteData, useQueryClient } from '@pkg/solid-query';

import type { RefOf } from '~/api/atp-schema.ts';
import { ListPurposeLabels } from '~/api/display.ts';
import { multiagent } from '~/api/globals/agent.ts';
import type { FilterPreferences } from '~/api/types.ts';

import { updateProfileMute } from '~/api/mutations/mute-profile.ts';
import type { TimelinePage, getTimelineKey } from '~/api/queries/get-timeline.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';
import { produceTimelineFilter } from '~/api/updaters/timeline-filter.ts';

import { closeModal } from '../../globals/modals.tsx';

import { Button } from '../../primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog.ts';

import SelectInput from '../inputs/SelectInput.tsx';
import DialogOverlay from './DialogOverlay.tsx';

import TakingActionNotice from '../views/TakingActionNotice.tsx';
import { isProfileTempMuted, useBustRevCache } from '../SharedPreferences.tsx';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

type ListView = RefOf<'app.bsky.graph.defs#listViewBasic'>;

export interface MuteConfirmDialogProps {
	profile: SignalizedProfile;
	filters: FilterPreferences;
	forceTempMute?: boolean;
}

const MuteConfirmDialog = (props: MuteConfirmDialogProps) => {
	return (() => {
		const profile = props.profile;

		const mutedByList = profile.viewer.mutedByList.value;
		if (mutedByList) {
			return renderMutedByListDialog(profile, mutedByList);
		}

		return renderMuteConfirmDialog(profile, props.filters, props.forceTempMute);
	}) as unknown as JSX.Element;
};

export default MuteConfirmDialog;

const renderMutedByListDialog = (profile: SignalizedProfile, list: ListView) => {
	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Cannot unmute this user</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-3' })}>
					<p class="text-sm">
						We can't unmute <strong>@{profile.handle.value}</strong> because you've chosen to mute users that
						are on this list:
					</p>

					<div class="flex flex-col gap-2 rounded-md border border-divider p-3 text-left text-sm">
						<div class="flex gap-3">
							<img
								src={/* @once */ list.avatar || DefaultListAvatar}
								class="mt-0.5 h-9 w-9 rounded-md object-cover"
							/>

							<div>
								<p class="font-bold">{/* @once */ list.name}</p>
								<p class="text-muted-fg">{
									/* @once */ `${ListPurposeLabels['app.bsky.graph.defs#modlist']}`
								}</p>
							</div>
						</div>
					</div>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'primary' })}>
						Dismiss
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};

const renderMuteConfirmDialog = (
	profile: SignalizedProfile,
	filters: FilterPreferences,
	forceTempMute?: boolean,
) => {
	const queryClient = useQueryClient();
	const bustRev = useBustRevCache();

	const isTempMuted = isProfileTempMuted(filters, profile.did);
	const isMuted = profile.viewer.muted.value || isTempMuted;

	const [duration, setDuration] = createSignal('' + (!forceTempMute ? -1 : 1 * 60 * 60 * 1_000));

	const isAccount = createMemo(() => {
		return multiagent.accounts.some((account) => account.did === profile.did);
	});

	const handleConfirm = () => {
		const uid = profile.uid;
		const did = profile.did;

		closeModal();

		if (isMuted) {
			if (isTempMuted) {
				const tempMutes = filters.tempMutes;

				batch(() => {
					delete tempMutes[did];
					bustRev();
				});
			} else {
				updateProfileMute(profile, false);
			}

			return;
		}

		const parsedDuration = parseInt(duration());

		if (Number.isNaN(parsedDuration) || parsedDuration < 0) {
			updateProfileMute(profile, true);
		} else {
			const date = Date.now() + parsedDuration;
			const tempMutes = filters.tempMutes;

			batch(() => {
				tempMutes[did] = date;
				bustRev();
			});
		}

		const updateTimeline = produceTimelineFilter(did);

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
	};

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>
						{`${isMuted ? `Unmute` : `Mute`} @${profile.handle.value}?`}
					</h1>
				</div>

				{isMuted ? (
					<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-4' })}>
						<p class="text-sm">Their posts will be allowed to show in your home timeline.</p>
						<TakingActionNotice uid={/* @once */ profile.uid} />
					</div>
				) : (
					<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-4' })}>
						<p class="text-sm">
							Their posts will no longer show up in your home timeline, but it will still allow them to see
							your posts and follow you.
						</p>

						{(() => {
							if (!isAccount()) {
								return (
									<label>
										<span class="mr-4 text-sm">Duration:</span>
										<SelectInput
											value={duration()}
											onChange={setDuration}
											options={[
												!forceTempMute && { value: '' + -1, label: 'Indefinite ' },
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

						{duration() !== '-1' ? (
							<p class="text-sm text-muted-fg">
								This mute action will not be synced to other clients and devices.
							</p>
						) : (
							<TakingActionNotice uid={/* @once */ profile.uid} />
						)}
					</div>
				)}

				<div class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>

					<button onClick={handleConfirm} class={/* @once */ Button({ variant: 'primary' })}>
						{isMuted ? `Unmute` : `Mute`}
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};
