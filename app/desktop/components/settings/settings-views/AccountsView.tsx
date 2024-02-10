import { type JSX, For } from 'solid-js';

import { useQueryClient } from '@pkg/solid-query';

import type { MultiagentAccountData } from '~/api/classes/multiagent';
import { multiagent } from '~/api/globals/agent.js';

import { openModal } from '~/com/globals/modals';

import { IconButton } from '~/com/primitives/icon-button';
import { MenuItem, MenuRoot } from '~/com/primitives/menu';

import { Flyout } from '~/com/components/Flyout';
import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog';

import AddIcon from '~/com/icons/baseline-add';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import AddAccountDialog from '../AddAccountDialog';

const AccountsView = () => {
	return (
		<div class="contents">
			<div class="flex h-13 shrink-0 items-center gap-2 border-b border-divider px-4">
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
				<For
					each={multiagent.accounts}
					fallback={
						<div class="grid h-13 shrink-0 place-items-center">
							<p class="text-sm text-muted-fg">No signed-in accounts</p>
						</div>
					}
				>
					{(account) => {
						const did = account.did;

						return (
							<div class="flex items-center gap-4 px-4 py-3">
								<img
									src={account.profile?.avatar || DefaultUserAvatar}
									class="h-12 w-12 shrink-0 rounded-full"
								/>

								<div class="flex min-w-0 grow flex-col text-sm">
									<p class="overflow-hidden text-ellipsis whitespace-nowrap font-bold empty:hidden">
										{account.profile?.displayName}
									</p>
									<p class="overflow-hidden text-ellipsis whitespace-nowrap text-muted-fg">
										{'@' + account.session.handle}
									</p>
									{multiagent.active === did && <p class="text-muted-fg">Default account</p>}
								</div>

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
									body={`This will sign you out of @${account.session.handle}, and you'll still be signed in to other accounts.`}
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
