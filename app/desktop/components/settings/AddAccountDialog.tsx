import { Match, Show, Switch, createEffect, createMemo, createSignal } from 'solid-js';

import { createMutation } from '@pkg/solid-query';

import { retrievePdsEndpoint } from '~/api/did';
import { multiagent } from '~/api/globals/agent';
import { DEFAULT_DATA_SERVERS } from '~/api/globals/defaults';

import { getProfile, getProfileKey } from '~/api/queries/get-profile';

import { queryClient } from '../../globals/query';

import { closeModal, useModalState } from '~/com/globals/modals';
import { model } from '~/utils/input';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';

import { Button } from '~/com/primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { Input } from '~/com/primitives/input';

const APP_PASSWORD_LINK = 'https://atproto.com/community/projects#app-passwords';

const AddAccountDialog = () => {
	const { disableBackdropClose } = useModalState();

	const [service, setService] = createSignal('');

	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');

	const [advanced, setAdvanced] = createSignal(false);

	const isEmail = createMemo(() => identifier().trim().indexOf('@') > 0);

	const loginMutation = createMutation(() => ({
		mutationKey: ['login'],
		mutationFn: async () => {
			let $identifier = identifier().trim();
			let $password = password();
			let $service = service();

			const isEmail = $identifier.indexOf('@') > 0;

			if (!isEmail) {
				$identifier = $identifier.replace(/^@/, '');
			}

			if (!$service) {
				if (isEmail) {
					// default to bsky.social if email address is used.
					$service = DEFAULT_DATA_SERVERS[0].url;
				} else {
					// we don't know which PDS they are on, so let's find it.
					$service = await retrievePdsEndpoint(queryClient, $identifier);
				}
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
					<div>
						<label class="block">
							<span class="mb-2 block text-sm font-medium leading-6 text-primary">Identifier</span>
							<input
								ref={model(identifier, setIdentifier)}
								type="text"
								required
								title="Bluesky handle, DID, or email address"
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
						</label>

						<Show when={advanced() && isEmail()}>
							<p class="mt-2 text-de text-muted-fg">
								As you're trying to sign in via email, please specify the provider you're signing into.
							</p>
						</Show>
					</div>

					<label class="block">
						<span class="mb-2 block text-sm font-medium leading-6 text-primary">Password</span>
						<input
							ref={model(password, setPassword)}
							type="password"
							required
							autocomplete="password"
							placeholder="Password"
							class={/* @once */ Input()}
						/>

						<p class="mt-2 text-de text-muted-fg">
							Using an app password is recommended.{' '}
							<a target="_blank" href={APP_PASSWORD_LINK} class="text-accent hover:underline">
								Learn more
							</a>
						</p>
					</label>

					<Show when={advanced()}>
						<label class="block">
							<span class="mb-2 block text-sm font-medium leading-6 text-primary">Hosting provider</span>
							<input
								ref={model(service, setService)}
								type="string"
								title="Domain name for the provider"
								pattern="([a-zA-Z0-9\\-]+(?:\\.[a-zA-Z0-9\\-]+)*(?:\\.[a-zA-Z]+))"
								placeholder={
									isEmail()
										? `Leave blank to connect to bsky.social`
										: `Leave blank for automatic provider detection`
								}
								class={/* @once */ Input()}
							/>
						</label>
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
