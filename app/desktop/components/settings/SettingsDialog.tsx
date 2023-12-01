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
			<div class={/* @once */ DialogRoot({ size: 'xl', fullHeight: true })}>
				<div class="flex grow overflow-hidden">
					<div class="w-72 shrink-0">
						<div class="h-13 border-b border-divider"></div>
						<div></div>
					</div>
					<div class="grow overflow-hidden overflow-y-auto border-l border-divider"></div>
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
