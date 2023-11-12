import { For, Show } from 'solid-js';

import { multiagent } from '~/api/globals/agent.js';

import { closeModal, openModal } from '~/com/globals/modals.tsx';

import * as dialog from '~/com/primitives/dialog.ts';
import iconButton from '~/com/primitives/icon-button.ts';

import CloseIcon from '~/com/icons/baseline-close.tsx';
import MoreHorizIcon from '~/com/icons/baseline-more-horiz.tsx';

import AddAccountDialog from './AddAccountDialog.tsx';

const SettingsDialog = () => {
	const asDefault = () => multiagent.active;

	const accounts = () => {
		const array = multiagent.accounts.slice();
		const active = multiagent.active;

		if (active) {
			array.sort((account) => (account.did === active ? -1 : 1));
		}

		return array;
	};

	return (
		<div class={/* @once */ dialog.root({ size: 'lg', fullHeight: true })}>
			<div class={/* @once */ dialog.header({ divider: true })}>
				<h1 class={/* @once */ dialog.title()}>Application settings</h1>

				<button onClick={closeModal} class={/* @once */ iconButton({ edge: 'right' })}>
					<CloseIcon />
				</button>
			</div>

			<div class={/* @once */ dialog.body({ padded: false })}>
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

					<For each={accounts()} fallback={<p class="px-4 py-3 text-sm">No accounts added yet.</p>}>
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
										<button class={/* @once */ iconButton({ edge: 'right', color: 'muted' })}>
											<MoreHorizIcon />
										</button>
									</div>
								</div>
							);
						}}
					</For>
				</div>
			</div>
		</div>
	);
};

export default SettingsDialog;
