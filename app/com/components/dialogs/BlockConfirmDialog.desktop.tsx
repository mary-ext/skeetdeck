import { createEffect, createSignal } from 'solid-js';

import { type InfiniteData, createQuery, useQueryClient } from '@pkg/solid-query';

import type { AppBskyGraphDefs } from '~/api/atp-schema';
import { getAccountHandle, multiagent } from '~/api/globals/agent';
import { formatQueryError } from '~/api/utils/misc';

import { updateProfileBlock } from '~/api/mutations/block-profile';
import { getInitialProfile, getProfile, getProfileKey } from '~/api/queries/get-profile';
import type { TimelinePage, getTimelineKey } from '~/api/queries/get-timeline';
import type { SignalizedProfile } from '~/api/stores/profiles';
import { produceTimelineFilter } from '~/api/updaters/timeline-filter';

import { closeModal } from '../../globals/modals';

import CircularProgress from '../CircularProgress';
import DialogOverlay from './DialogOverlay';

import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog';
import { Button } from '../../primitives/button';

import { EmbedListContent } from '../embeds/EmbedList';

import SwitchAccountAction from '~/desktop/components/flyouts/SwitchAccountAction';

import type { BlockConfirmDialogProps } from './BlockConfirmDialog';

type ListViewBasic = AppBskyGraphDefs.ListViewBasic;

const BlockConfirmDialog = (props: BlockConfirmDialogProps) => {
	const [uid, setUid] = createSignal(props.uid);

	const did = props.did;

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
		if (!multiagent.accounts.some((account) => account.did === $uid)) {
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
						const blockingByList = profile.viewer.blockingByList.value;

						if (blockingByList) {
							return renderBlockingByListDialog(profile, blockingByList);
						}

						return renderBlockConfirmDialog(profile);
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
						<div class="grid place-items-center" style="height:180px">
							<CircularProgress />
						</div>
					);
				})()}

				{multiagent.accounts.length > 1 && (
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
				)}
			</div>
		</DialogOverlay>
	);
};

export default BlockConfirmDialog;

const renderBlockingByListDialog = (profile: SignalizedProfile, list: ListViewBasic) => {
	return (
		<div class="contents">
			<div class={/* @once */ DialogHeader()}>
				<h1 class={/* @once */ DialogTitle()}>Cannot unblock this user</h1>
			</div>

			<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-3' })}>
				<p class="text-sm">
					We can't unblock <strong>@{profile.handle.value}</strong> because you've chosen to block users that
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

const renderBlockConfirmDialog = (profile: SignalizedProfile) => {
	const queryClient = useQueryClient();

	const blocking = () => profile.viewer.blocking.value;

	const handleConfirm = () => {
		const next = !blocking();

		closeModal();
		updateProfileBlock(profile, next);

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
				>{`${!blocking() ? `Block` : `Unblock`} @${profile.handle.value}?`}</h1>
			</div>

			<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-4' })}>
				<p class="text-sm">
					{!blocking() ? (
						<>
							They will not be able to view your posts, mention you, or otherwise interact with you, and you
							will not see posts or replies from <b>{'@' + profile.handle.value}</b>.
						</>
					) : (
						<>They will be allowed to view your posts, and interact with you.</>
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
					{!blocking() ? `Block` : `Unblock`}
				</button>
			</div>
		</div>
	);
};
