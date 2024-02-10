import { createEffect, createSignal } from 'solid-js';

import { type InfiniteData, createQuery, useQueryClient } from '@pkg/solid-query';

import type { RefOf } from '~/api/atp-schema.ts';
import { getAccountHandle, multiagent } from '~/api/globals/agent.ts';
import { formatQueryError } from '~/api/utils/misc.ts';

import { updateProfileMute } from '~/api/mutations/mute-profile.ts';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile.ts';
import type { TimelinePage, getTimelineKey } from '~/api/queries/get-timeline.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';
import { produceTimelineFilter } from '~/api/updaters/timeline-filter.ts';

import { closeModal } from '../../globals/modals.tsx';

import CircularProgress from '../CircularProgress.tsx';
import DialogOverlay from './DialogOverlay.tsx';

import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog.ts';
import { Button } from '../../primitives/button.ts';

import { EmbedListContent } from '../embeds/EmbedList.tsx';

import SwitchAccountAction from '~/desktop/components/flyouts/SwitchAccountAction.tsx';

import type { MuteConfirmDialogProps } from './MuteConfirmDialog.tsx';

type ListViewBasic = RefOf<'app.bsky.graph.defs#listViewBasic'>;

const MuteConfirmDialog = (props: MuteConfirmDialogProps) => {
	const did = props.did;

	const [uid, setUid] = createSignal(props.uid);

	const query = createQuery(() => {
		const key = getProfileKey(uid(), did);

		return {
			queryKey: key,
			queryFn: getProfile,
			initialData: () => getInitialProfile(key),
			initialDataUpdatedAt: 0,
		};
	});

	createEffect(() => {
		const $uid = uid();
		if ($uid && !multiagent.accounts.some((account) => account.did === $uid)) {
			const next = multiagent.active;

			if (next) {
				setUid(next);
			} else {
				closeModal();
			}
		}
	});

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				{(() => {
					const profile = query.data;
					if (profile) {
						const mutedByList = profile.viewer.mutedByList.value;
						if (mutedByList) {
							return renderMutedByListDialog(profile, mutedByList);
						}

						return renderMuteConfirmDialog(profile);
					}

					if (query.isError) {
						return (
							<div class="contents">
								<div class={/* @once */ DialogHeader()}>
									<h1 class={/* @once */ DialogTitle()}>Something went wrong</h1>
								</div>

								<div class={/* @once */ DialogBody({ padded: true })}>
									<p class="text-sm">Please try again later.</p>
									<p class="text-sm text-muted-fg">{formatQueryError(query.error)}</p>
								</div>

								<div class={/* @once */ DialogActions()}>
									<button onClick={closeModal} class={/* @once */ Button({ variant: 'primary' })}>
										Dismiss
									</button>
								</div>
							</div>
						);
					}

					return (
						<div class="grid place-items-center" style="height:160px">
							<CircularProgress />
						</div>
					);
				})()}

				<div class="shrink-0 border-t border-divider p-4 text-sm">
					<div class="flex items-center justify-between gap-4">
						<span class="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
							Taking action as <b class="text-primary">{'@' + getAccountHandle(uid())}</b>
						</span>

						<SwitchAccountAction value={uid()} exclude={[did]} onChange={setUid}>
							<button class="text-accent hover:underline">Change</button>
						</SwitchAccountAction>
					</div>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default MuteConfirmDialog;

const renderMutedByListDialog = (profile: SignalizedProfile, list: ListViewBasic) => {
	return (
		<div class="contents">
			<div class={/* @once */ DialogHeader()}>
				<h1 class={/* @once */ DialogTitle()}>Cannot unmute this user</h1>
			</div>

			<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-3' })}>
				<p class="text-sm">
					We can't unmute <strong>@{profile.handle.value}</strong> because you've chosen to mute users that
					are on this list:
				</p>

				<EmbedListContent list={list} />
			</div>

			<div class={/* @once */ DialogActions()}>
				<button onClick={closeModal} class={/* @once */ Button({ variant: 'primary' })}>
					Dismiss
				</button>
			</div>
		</div>
	);
};

const renderMuteConfirmDialog = (profile: SignalizedProfile) => {
	const queryClient = useQueryClient();

	const muted = () => profile.viewer.muted.value;

	const handleConfirm = () => {
		const next = !muted();

		closeModal();
		updateProfileMute(profile, next);

		if (next) {
			const uid = profile.uid;
			const did = profile.did;

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
		}
	};

	return (
		<div class="contents">
			<div class={/* @once */ DialogHeader()}>
				<h1
					class={/* @once */ DialogTitle()}
				>{`${!muted() ? `Mute` : `Unmute`} @${profile.handle.value}?`}</h1>
			</div>

			<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-4' })}>
				<p class="text-sm">
					{!muted() ? (
						<>
							Their posts will no longer show up in your timeline, but it will still allow them to see your
							posts and follow you.
						</>
					) : (
						<>Their posts will be allowed to show in your timeline.</>
					)}
				</p>
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
					{!muted() ? `Mute` : `Unmute`}
				</button>
			</div>
		</div>
	);
};
