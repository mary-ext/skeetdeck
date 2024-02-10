import { type JSX, createSignal } from 'solid-js';

import { subscribeListBlock } from '~/api/mutations/subscribe-list-block';
import { subscribeListMute } from '~/api/mutations/subscribe-list-mute';
import type { SignalizedList } from '~/api/stores/lists';

import { createRadioModel } from '~/utils/input';
import { getUniqueId } from '~/utils/misc';

import { closeModal } from '../../../globals/modals';

import { Button } from '../../../primitives/button';
import {
	DialogActions,
	DialogBody,
	DialogHeader,
	DialogRoot,
	DialogTitle,
} from '../../../primitives/dialog';

import ConfirmDialog from '../ConfirmDialog';
import DialogOverlay from '../DialogOverlay';
import Radio from '../../inputs/Radio';

export interface SubscribeListDialogProps {
	list: SignalizedList;
}

const enum Subscription {
	MUTED,
	BLOCKED,
}

const getSubscriptionState = (list: SignalizedList) => {
	const viewer = list.viewer;

	if (viewer.muted.value) {
		return Subscription.MUTED;
	}

	if (viewer.blocked.value) {
		return Subscription.BLOCKED;
	}

	return undefined;
};

const SubscribeListDialog = (props: SubscribeListDialogProps) => {
	return (() => {
		const list = props.list;
		const subscription = getSubscriptionState(list);

		if (subscription !== undefined) {
			return renderUnsubscribeDialog(list, subscription);
		}

		return renderSubscribeDialog(list);
	}) as unknown as JSX.Element;
};

export default SubscribeListDialog;

const renderUnsubscribeDialog = (list: SignalizedList, subscription: Subscription) => {
	return (
		<ConfirmDialog
			title={`Unsubscribe from list?`}
			body={
				/* @once */ subscription === Subscription.BLOCKED ? (
					<>
						You're currently blocking the users in <strong class="text-ellipsis">{list.name.value}</strong>,
						by unsubscribing, they will be allowed to view your posts and interact with you.
					</>
				) : (
					<>
						You're currently muting the users in <strong class="text-ellipsis">{list.name.value}</strong>, by
						unsubscribing, their interactions will be allowed to show in your timeline and notifications.
					</>
				)
			}
			confirmation="Unsubscribe"
			onConfirm={() => {
				if (subscription === Subscription.BLOCKED) {
					subscribeListBlock(list, false);
				} else {
					subscribeListMute(list, false);
				}
			}}
		/>
	);
};

const renderSubscribeDialog = (list: SignalizedList) => {
	const [selected, setSelected] = createSignal<Subscription>();
	const formId = getUniqueId();
	const selectModel = createRadioModel(selected, setSelected);

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Subscribe list?</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: true, class: 'flex flex-col' })}>
					<p class="text-sm">
						You're about to subscribe to <strong>{list.name.value}</strong>, what would you like to do?
					</p>

					<label class="block py-3">
						<div class="flex min-w-0 justify-between gap-4">
							<span class="text-sm">Mute users from this list</span>
							<Radio ref={selectModel(Subscription.MUTED)} name={formId} />
						</div>
						<p class="mr-6 text-de text-muted-fg">
							Their interactions will no longer show up in your timeline and notifications, but it will still
							allow them to see your posts and interact with you.
						</p>
					</label>

					<label class="block py-3">
						<div class="flex min-w-0 justify-between gap-4">
							<span class="text-sm">Block users from this list</span>
							<Radio ref={selectModel(Subscription.BLOCKED)} name={formId} />
						</div>
						<p class="mr-6 text-de text-muted-fg">
							They will not be able to see your posts or otherwise interact with you, and you will not see
							posts and replies from them.
						</p>
					</label>
				</div>

				<div class={/* @once */ DialogActions()}>
					<button onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>
					<button
						disabled={selected() === undefined}
						onClick={() => {
							closeModal();

							if (selected() === Subscription.BLOCKED) {
								subscribeListBlock(list, true);
							} else {
								subscribeListMute(list, true);
							}
						}}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						Subscribe
					</button>
				</div>
			</div>
		</DialogOverlay>
	);
};
