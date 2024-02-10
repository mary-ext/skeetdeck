import { type Component, Match, Show, Switch, createSignal } from 'solid-js';

import type { DID } from '~/api/atp-schema';
import { getAccountHandle, multiagent } from '~/api/globals/agent';
import { getCurrentTid } from '~/api/utils/tid';

import { FILTER_ALL } from '~/api/queries/get-notifications';

import { createDerivedSignal } from '~/utils/hooks';

import { closeModal } from '~/com/globals/modals';

import {
	type DeckConfig,
	type HomePaneConfig,
	type NotificationsPaneConfig,
	type PaneConfig,
	type PaneType,
	PANE_TYPE_FEED,
	PANE_TYPE_HOME,
	PANE_TYPE_LIST,
	PANE_TYPE_NOTIFICATIONS,
	PANE_TYPE_PROFILE,
	SpecificPaneSize,
	labelizePaneType,
} from '../../globals/panes';

import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { IconButton } from '~/com/primitives/icon-button';
import { Interactive } from '~/com/primitives/interactive';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';
import SelectInput from '~/com/components/inputs/SelectInput';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import CloseIcon from '~/com/icons/baseline-close';
import HomeOutlinedIcon from '~/com/icons/outline-home';
import ListBoxOutlinedIcon from '~/com/icons/outline-list-box';
import NotificationsOutlinedIcon from '~/com/icons/outline-notifications';
import PersonOutlinedIcon from '~/com/icons/outline-person';
import PoundIcon from '~/com/icons/baseline-pound';

import type { AddFn, PaneCreatorProps } from './pane-creators/types';
import CustomFeedPaneCreator from './pane-creators/CustomFeedPaneCreator';
import CustomListPaneCreator from './pane-creators/CustomListPaneCreator';
import ProfilePaneCreator from './pane-creators/ProfilePaneCreator';

export interface AddPaneDialogProps {
	/** Expected to be static */
	deck: DeckConfig;
}

// @ts-expect-error
const components: Record<PaneType, Component<PaneCreatorProps>> = {
	[PANE_TYPE_FEED]: CustomFeedPaneCreator,
	[PANE_TYPE_LIST]: CustomListPaneCreator,
	[PANE_TYPE_PROFILE]: ProfilePaneCreator,
};

const columnItem = Interactive({ class: 'flex items-center gap-4 p-4 text-sm' });

const AddPaneDialog = (props: AddPaneDialogProps) => {
	const deck = props.deck;

	const [type, setType] = createSignal<PaneType>();
	const [user, setUser] = createDerivedSignal(() => multiagent.active);

	const add: AddFn = (partial) => {
		const $user = user();

		if ($user) {
			// @ts-expect-error
			const pane: PaneConfig = {
				...partial,
				id: getCurrentTid(),
				size: SpecificPaneSize.INHERIT,
				title: null,
				uid: $user,
			};

			deck.panes.push(pane);
		}

		closeModal();
	};

	const creatorProps: PaneCreatorProps = {
		get uid() {
			return user() as DID;
		},
		onAdd: add,
	};

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'md', fullHeight: true })}>
				<div class={/* @once */ DialogHeader({ divider: true })}>
					{(() => {
						if (type() === undefined) {
							return (
								<button
									title="Close dialog"
									onClick={closeModal}
									class={/* @once */ IconButton({ edge: 'left' })}
								>
									<CloseIcon />
								</button>
							);
						} else {
							return (
								<button
									title="Return to previous screen"
									onClick={() => setType(undefined)}
									class={/* @once */ IconButton({ edge: 'left' })}
								>
									<ArrowLeftIcon />
								</button>
							);
						}
					})()}

					<Show when={type()} fallback={<h1 class={/* @once */ DialogTitle()}>Add a new column</h1>}>
						{(type) => (
							<div class="flex min-w-0 grow flex-col gap-0.5">
								<p class="text-base font-bold leading-5">Add a {labelizePaneType(type())} column</p>
								<p class="overflow-hidden text-ellipsis whitespace-nowrap text-xs text-muted-fg">
									@{getAccountHandle(user() as DID)}
								</p>
							</div>
						)}
					</Show>
				</div>

				<Switch>
					<Match when={type() === undefined}>
						<div class={/* @once */ DialogBody({ padded: false })}>
							<div class="flex items-center justify-between gap-4 p-4">
								<p class="grow text-base font-bold leading-5">Choose one</p>

								<SelectInput
									disabled={multiagent.accounts.length < 2}
									value={user() || ''}
									onChange={setUser}
									options={multiagent.accounts.map((account) => ({
										value: account.did,
										get label() {
											return '@' + account.session.handle;
										},
									}))}
								/>
							</div>

							<div class="flex flex-col">
								<button
									onClick={() =>
										add<HomePaneConfig>({
											type: PANE_TYPE_HOME,
											showReplies: 'follows',
											showReposts: true,
											showQuotes: true,
										})
									}
									class={columnItem}
								>
									<HomeOutlinedIcon class="text-xl" />
									<span>Home timeline</span>
								</button>

								<button onClick={() => setType(PANE_TYPE_LIST)} class={columnItem}>
									<ListBoxOutlinedIcon class="text-xl" />
									<span>User lists</span>
								</button>

								<button onClick={() => setType(PANE_TYPE_FEED)} class={columnItem}>
									<PoundIcon class="text-xl" />
									<span>Feeds</span>
								</button>

								<button onClick={() => setType(PANE_TYPE_PROFILE)} class={columnItem}>
									<PersonOutlinedIcon class="text-xl" />
									<span>Profiles</span>
								</button>

								<button
									onClick={() =>
										add<NotificationsPaneConfig>({ type: PANE_TYPE_NOTIFICATIONS, mask: FILTER_ALL })
									}
									class={columnItem}
								>
									<NotificationsOutlinedIcon class="text-xl" />
									<span>Notifications</span>
								</button>
							</div>
						</div>
					</Match>

					<Match
						when={(() => {
							const $type = type();
							return $type && components[$type];
						})()}
						keyed
					>
						{(Component) => <Component {...creatorProps} />}
					</Match>
				</Switch>
			</div>
		</DialogOverlay>
	);
};

export default AddPaneDialog;
