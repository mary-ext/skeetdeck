import { type JSX, For } from 'solid-js';

import { useQueryClient } from '@mary/solid-query';

import type { MultiagentAccountData } from '~/api/classes/multiagent';
import { multiagent } from '~/api/globals/agent.js';

import { openModal } from '~/com/globals/modals';

import { IconButton } from '~/com/primitives/icon-button';
import { ListBox, ListBoxItemChevron, ListBoxItemInteractive } from '~/com/primitives/list-box';
import { MenuItem, MenuRoot } from '~/com/primitives/menu';

import { Flyout } from '~/com/components/Flyout';
import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog';

import AddIcon from '~/com/icons/baseline-add';
import ChevronRightIcon from '~/com/icons/baseline-chevron-right';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz';

import DefaultUserAvatar from '~/com/assets/default-user-avatar.svg?url';

import { VIEW_ACCOUNT_CONFIG, useViewRouter } from './_router';

import AddAccountDialog from '../AddAccountDialog';

const AccountsView = () => {
	const router = useViewRouter();

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
			<div class="flex grow flex-col gap-6 overflow-y-auto p-4">
				{multiagent.accounts.length === 0 ? (
					<div class="text-center text-sm text-muted-fg">No accounts added.</div>
				) : (
					<div class={ListBox}>
						<For each={multiagent.accounts}>
							{(account) => (
								<div class="flex">
									<button
										onClick={() => router.to({ type: VIEW_ACCOUNT_CONFIG, did: account.did })}
										class={`${ListBoxItemInteractive} grow`}
									>
										<img
											src={account.profile?.avatar || DefaultUserAvatar}
											class="mt-1 h-8 w-8 shrink-0 rounded-full"
										/>

										<div class="flex min-w-0 grow flex-col text-sm">
											<p class="overflow-hidden text-ellipsis whitespace-nowrap font-medium empty:hidden">
												{account.profile?.displayName}
											</p>
											<p class="overflow-hidden text-ellipsis whitespace-nowrap text-de text-muted-fg">
												{'@' + account.session.handle}
											</p>

											{multiagent.active === account.did && (
												<p class="text-de text-muted-fg">Primary account</p>
											)}
										</div>

										<ChevronRightIcon class={`${ListBoxItemChevron} self-center`} />
									</button>

									<div class="my-4 border-r border-secondary/30"></div>

									<div class="flex items-center px-2">
										<AccountActionMenu account={account}>
											<button title="Actions" class={/* @once */ IconButton({ color: 'muted' })}>
												<MoreHorizIcon />
											</button>
										</AccountActionMenu>
									</div>
								</div>
							)}
						</For>
					</div>
				)}
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
						Set as primary
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
