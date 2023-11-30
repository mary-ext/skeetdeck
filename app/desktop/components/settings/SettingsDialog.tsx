import { For, JSX, Show } from 'solid-js';

import { useQueryClient } from '@pkg/solid-query';

import type { MultiagentAccountData } from '~/api/classes/multiagent.ts';
import { multiagent } from '~/api/globals/agent.js';

import { closeModal, openModal } from '~/com/globals/modals.tsx';

import { DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { IconButton } from '~/com/primitives/icon-button.ts';
import { MenuItem, MenuRoot } from '~/com/primitives/menu.ts';

import { Flyout } from '~/com/components/Flyout.tsx';
import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog.tsx';
import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';

import CloseIcon from '~/com/icons/baseline-close.tsx';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';

import AddAccountDialog from './AddAccountDialog.tsx';

const SettingsDialog = () => {
	const asDefault = () => multiagent.active;

	return (
		<DialogOverlay>
			<div class={/* @once */ DialogRoot({ size: 'lg', fullHeight: true })}>
				<div class={/* @once */ DialogHeader({ divider: true })}>
					<button onClick={closeModal} class={/* @once */ IconButton({ edge: 'left' })}>
						<CloseIcon />
					</button>

					<h1 class={/* @once */ DialogTitle()}>Application settings</h1>
				</div>

				<div class={/* @once */ DialogBody({ padded: false })}>
					<div class="flex flex-col border-b border-divider pb-2">
						<div class="flex items-center justify-between gap-4 p-4">
							<p class="text-base font-bold leading-5">Accounts</p>
							<button
								onClick={() => {
									openModal(() => <AddAccountDialog />);
								}}
								class="text-sm text-accent hover:underline"
							>
								Add
							</button>
						</div>

						<For
							each={multiagent.accounts}
							fallback={<p class="px-4 py-3 text-sm">No accounts added yet.</p>}
						>
							{(account) => {
								const did = account.did;

								return (
									<div class="flex items-center gap-4 px-4 py-3">
										<div class="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-muted-fg">
											<Show when={account.profile?.avatar}>
												{(avatar) => <img src={avatar()} class="h-full w-full" />}
											</Show>
										</div>

										<Show when={account.profile} fallback={<div class="grow text-sm">{did}</div>}>
											{(profile) => (
												<div class="flex grow flex-col text-sm">
													<span class="line-clamp-1 break-all font-bold">
														{profile().displayName || profile().handle}
													</span>
													<span class="line-clamp-1 break-all text-muted-fg">@{profile().handle}</span>
													<Show when={did === asDefault()}>
														<span class="text-muted-fg">Default account</span>
													</Show>
												</div>
											)}
										</Show>

										<div>
											<AccountActionMenu account={account}>
												<button class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}>
													<MoreHorizIcon />
												</button>
											</AccountActionMenu>
										</div>
									</div>
								);
							}}
						</For>
					</div>
				</div>
			</div>
		</DialogOverlay>
	);
};

export default SettingsDialog;

interface AccountActionMenuProps {
	/** Expected to be static */
	account: MultiagentAccountData;
	children: JSX.Element;
}

const AccountActionMenu = (props: AccountActionMenuProps) => {
	const queryClient = useQueryClient();

	const account = props.account;
	const did = account.did;

	return (
		<Flyout button={props.children}>
			{({ close, menuProps }) => (
				<div {...menuProps} class={/* @once */ MenuRoot()}>
					<button
						disabled={did === multiagent.active}
						onClick={() => {
							close();
							multiagent.active = did;
						}}
						class={/* @once */ MenuItem()}
					>
						Set as default
					</button>
					<button
						onClick={() => {
							close();

							openModal(() => (
								<ConfirmDialog
									title={`Sign out?`}
									body={`This will sign you out of @${
										account.profile?.handle || account.session.handle
									}, and you'll still be signed in to other accounts.`}
									confirmation={`Sign out`}
									onConfirm={() => {
										multiagent.logout(did);

										queryClient.resetQueries({
											predicate: (query) => {
												const key = query.queryKey;
												return key.length >= 2 && key[1] === did && !(key[0] as string).includes('/');
											},
										});
									}}
								/>
							));
						}}
						class={/* @once */ MenuItem()}
					>
						Sign out
					</button>
				</div>
			)}
		</Flyout>
	);
};
