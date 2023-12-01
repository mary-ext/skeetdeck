import { For, JSX, Show } from 'solid-js';

import { useQueryClient } from '@pkg/solid-query';

import type { MultiagentAccountData } from '~/api/classes/multiagent.ts';
import { multiagent } from '~/api/globals/agent.js';

import { openModal } from '~/com/globals/modals.tsx';

import { IconButton } from '~/com/primitives/icon-button.ts';
import { MenuItem, MenuRoot } from '~/com/primitives/menu.ts';

import { Flyout } from '~/com/components/Flyout.tsx';
import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog.tsx';

import AddIcon from '~/com/icons/baseline-add.tsx';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import AddAccountDialog from '../AddAccountDialog.tsx';

const AccountsView = () => {
	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 px-4">
				<h2 class="grow text-base font-bold">Accounts</h2>

				<button
					title="Add new account"
					onClick={() => {
						openModal(() => <AddAccountDialog />);
					}}
					class={/* @once */ IconButton({ edge: 'right' })}
				>
					<AddIcon />
				</button>
			</div>
			<div class="grow overflow-y-auto">
				<For each={multiagent.accounts} fallback={<p class="px-4 py-3 text-sm">No accounts added yet.</p>}>
					{(account) => {
						const did = account.did;

						return (
							<div class="flex items-center gap-4 px-4 py-3">
								<img
									src={account.profile?.avatar || DefaultUserAvatar}
									class="h-12 w-12 shrink-0 rounded-full"
								/>

								<Show when={account.profile} fallback={<div class="grow text-sm">{did}</div>}>
									{(profile) => (
										<div class="flex grow flex-col text-sm">
											<span class="line-clamp-1 break-all font-bold">
												{profile().displayName || profile().handle}
											</span>
											<span class="line-clamp-1 break-all text-muted-fg">@{profile().handle}</span>
											<Show when={did === multiagent.active}>
												<span class="text-muted-fg">Default account</span>
											</Show>
										</div>
									)}
								</Show>

								<div>
									<AccountActionMenu account={account}>
										<button title="Actions" class={/* @once */ IconButton({ edge: 'right', color: 'muted' })}>
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
	);
};

export default AccountsView;

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
