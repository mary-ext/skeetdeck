import { type JSX } from 'solid-js';

import { type InfiniteData, useQueryClient } from '@pkg/solid-query';

import type { RefOf } from '~/api/atp-schema.ts';
import { ListPurposeLabels } from '~/api/display.ts';

import { produceTimelineFilter } from '~/utils/immer.ts';

import type { TimelinePage, getTimelineKey } from '~/api/queries/get-timeline.ts';
import { updateProfileBlock } from '~/api/mutations/block-profile.ts';
import type { SignalizedProfile } from '~/api/stores/profiles.ts';

import { closeModal } from '../../globals/modals.tsx';

import { Button } from '../../primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '../../primitives/dialog.ts';

import TakingActionNotice from '../views/TakingActionNotice.tsx';
import DialogOverlay from './DialogOverlay.tsx';
import ConfirmDialog from './ConfirmDialog.tsx';

import DefaultListAvatar from '../../assets/default-list-avatar.svg?url';

type ListView = RefOf<'app.bsky.graph.defs#listViewBasic'>;

export interface BlockConfirmDialogProps {
	profile: SignalizedProfile;
}

const BlockConfirmDialog = (props: BlockConfirmDialogProps) => {
	return (() => {
		const profile = props.profile;

		const blockingByList = profile.viewer.blockingByList.value;
		if (blockingByList) {
			return renderBlockingByListDialog(profile, blockingByList);
		}

		return renderBlockConfirmDialog(profile);
	}) as unknown as JSX.Element;
};

export default BlockConfirmDialog;

const renderBlockingByListDialog = (profile: SignalizedProfile, list: ListView) => {
	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Cannot unblock this user</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col gap-3' })}>
					<p class="text-sm">
						We can't unblock <strong>@{profile.handle.value}</strong> because you've chosen to block users
						that are on this list:
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

const renderBlockConfirmDialog = (profile: SignalizedProfile) => {
	const queryClient = useQueryClient();

	const isBlocking = () => profile.viewer.blocking.value;

	return (
		<ConfirmDialog
			title={`${isBlocking() ? 'Unblock' : 'Block'} @${profile.handle.value}?`}
			body={
				<>
					<p class="text-sm">
						{isBlocking()
							? `They will be allowed to view your posts, and interact with you.`
							: `They will not be able to view your posts, mention you, or otherwise interact with you, and you will not see posts or replies from @${profile.handle.value}.`}
					</p>

					<TakingActionNotice uid={/* @once */ profile.uid} />
				</>
			}
			unwrap
			confirmation={isBlocking() ? `Unblock` : `Block`}
			onConfirm={() => {
				const next = !isBlocking();

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
			}}
		/>
	);
};
