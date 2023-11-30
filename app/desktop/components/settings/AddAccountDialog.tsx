import { Match, Show, Switch, createEffect, createMemo, createSignal } from 'solid-js';

import { createMutation } from '@pkg/solid-query';

import { retrievePdsEndpoint } from '~/api/did.ts';
import { multiagent } from '~/api/globals/agent.ts';

import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { queryClient } from '../../globals/query.ts';

import { closeModal, openModal, useModalState } from '~/com/globals/modals.tsx';
import { model } from '~/utils/input.ts';

import ConfirmDialog from '~/com/components/dialogs/ConfirmDialog.tsx';
import DialogOverlay from '~/com/components/dialogs/DialogOverlay.tsx';

import { Button } from '~/com/primitives/button.ts';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog.ts';
import { Input } from '~/com/primitives/input.ts';

const APP_PASSWORD_REGEX = /^[a-zA-Z\d]{4}(-[a-zA-Z\d]{4}){3}$/;
const APP_PASSWORD_LINK = 'https://atproto.com/community/projects#app-passwords';

const AddAccountDialog = () => {
	const { disableBackdropClose } = useModalState();

	const [service, setService] = createSignal('');

	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');

	const [advanced, setAdvanced] = createSignal(false);

	const isEmail = createMemo(() => identifier().includes('@'));

	const loginMutation = createMutation(() => ({
		mutationKey: ['login'],
		mutationFn: async () => {
			const $identifier = identifier().trim();
			const $password = password();

			let $service = service();

			// we don't know which PDS they are on, so let's find it.
			if (!$service) {
				$service = await retrievePdsEndpoint(queryClient, $identifier);
			} else {
				$service = `https://${$service}`;
			}

			const uid = await multiagent.login({
				service: $service,
				identifier: $identifier,
				password: $password,
			});

			// Invalidate any queries involving this DID,
			// in the case that we're signing in to an already added account.
			queryClient.invalidateQueries({
				predicate: (query) => {
					const key = query.queryKey;
					return key.length >= 2 && key[1] === uid && !(key[0] as string).includes('/');
				},
			});

			// Fetch the profile while we're at it,
			// let's set the GC time to 1 minute just in case.
			await queryClient.fetchQuery({
				queryKey: getProfileKey(uid, uid),
				queryFn: getProfile,
				gcTime: 60 * 1_000,
			});
		},
		onSuccess() {
			closeModal();
		},
	}));

	const handleSubmit = (ev: SubmitEvent) => {
		ev.preventDefault();

		if (!APP_PASSWORD_REGEX.test(password())) {
			openModal(() => (
				<ConfirmDialog
					title={`Password notice`}
					body={
						<>
							You're attempting to sign in without using an app password, this could be dangerous to your
							account's safety. We recommend using app passwords when signing in to third-party clients like
							Skeetdeck.{' '}
							<a href={APP_PASSWORD_LINK} target="_blank" class="text-accent hover:underline">
								Learn more here
							</a>
							.
						</>
					}
					confirmation={`Continue anyway`}
					onConfirm={() => loginMutation.mutate()}
				/>
			));

			return;
		}

		loginMutation.mutate();
	};

	createEffect(() => {
		disableBackdropClose.value = loginMutation.isPending;
	});

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot()}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Add new account</h1>
				</div>

				<fieldset
					disabled={loginMutation.isPending}
					class={/* @once */ DialogBody({ class: 'flex flex-col gap-4' })}
				>
					<div class="flex flex-col">
						<label for="user" class="mb-2 block text-sm font-medium leading-6 text-primary">
							Identifier
						</label>
						<input
							ref={model(identifier, setIdentifier)}
							type="text"
							id="user"
							required
							pattern=".*\\S+.*"
							placeholder="you.bsky.social"
							autocomplete="username"
							onBlur={() => {
								if (isEmail()) {
									setAdvanced(true);
								}
							}}
							class={/* @once */ Input()}
						/>

						<Show when={advanced() && isEmail()}>
							<p class="mt-3 text-xs text-muted-fg">
								As you're trying to sign in via email, please specify the provider you're signing into.
							</p>
						</Show>
					</div>

					<div class="flex flex-col gap-2">
						<label for="pwd" class="block text-sm font-medium leading-6 text-primary">
							Password
						</label>
						<input
							ref={model(password, setPassword)}
							type="password"
							id="pwd"
							required
							autocomplete="password"
							placeholder="Password"
							class={/* @once */ Input()}
						/>
					</div>

					<Show when={advanced()}>
						<div class="flex flex-col gap-2">
							<label for="svc" class="block text-sm font-medium leading-6 text-primary">
								Hosting provider
							</label>
							<input
								ref={model(service, setService)}
								type="string"
								id="svc"
								required={isEmail()}
								pattern="([a-zA-Z0-9\\-]+(?:\\.[a-zA-Z0-9\\-]+)*(?:\\.[a-zA-Z]+))"
								placeholder={isEmail() ? `example.social` : `Leave blank for automatic provider detection`}
								class={/* @once */ Input()}
							/>
						</div>
					</Show>

					<Switch>
						<Match when={loginMutation.error} keyed>
							{(error: any) => (
								<p class="text-sm leading-6 text-red-600">
									{error.cause ? error.cause.message : error.message || '' + error}
								</p>
							)}
						</Match>
					</Switch>
				</fieldset>

				<fieldset disabled={loginMutation.isPending} class={/* @once */ DialogActions()}>
					<Show when={!advanced()}>
						<button
							type="button"
							onClick={() => setAdvanced(true)}
							class={/* @once */ Button({ variant: 'ghost' })}
						>
							Advanced
						</button>
					</Show>

					<div class="grow"></div>

					<button type="button" onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
						Cancel
					</button>
					<button
						type="submit"
						disabled={isEmail() && !advanced()}
						class={/* @once */ Button({ variant: 'primary' })}
					>
						Sign in
					</button>
				</fieldset>
			</form>
		</DialogOverlay>
	);
};

export default AddAccountDialog;
