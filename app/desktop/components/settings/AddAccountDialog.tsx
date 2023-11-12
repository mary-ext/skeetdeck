import { Match, Show, Switch, createEffect, createSignal } from 'solid-js';

import { Agent } from '@externdefs/bluesky-client/agent';
import { createMutation, createQuery } from '@pkg/solid-query';

import type { DID } from '~/api/atp-schema.ts';
import { multiagent } from '~/api/globals/agent.ts';
import { type DataServer, APPVIEW_URL } from '~/api/globals/defaults.ts';
import { isDid } from '~/api/utils/misc.ts';

import _getDid from '~/api/queries/_did.ts';
import { getProfile, getProfileKey } from '~/api/queries/get-profile.ts';

import { queryClient } from '~/desktop/globals/query.ts';

import { closeModal, useModalState } from '~/com/globals/modals.tsx';
import { model } from '~/utils/input.ts';

import CircularProgress from '~/com/components/CircularProgress.tsx';

import button from '~/com/primitives/button.ts';
import * as dialog from '~/com/primitives/dialog.ts';
import input from '~/com/primitives/input.ts';

const AddAccountDialog = () => {
	const { disableBackdropClose } = useModalState();

	const [service, _setService] = createSignal<DataServer>();

	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');

	const loginMutation = createMutation(() => ({
		mutationKey: ['login'],
		mutationFn: async () => {
			const $identifier = identifier().trim();
			const $password = password();

			let $service = service();

			// we don't know which PDS they are on, so let's find it.
			if (!$service) {
				// 1. resolve the DID for the identifier
				let did: DID;
				if (isDid($identifier)) {
					did = $identifier;
				} else {
					did = await queryClient.fetchQuery({
						queryKey: ['appView/resolveHandle', $identifier],
						queryFn: async (ctx) => {
							const [, identifier] = ctx.queryKey;

							const agent = new Agent({ serviceUri: APPVIEW_URL });
							const response = await agent.rpc.get('com.atproto.identity.resolveHandle', {
								signal: ctx.signal,
								params: {
									handle: identifier,
								},
							});

							return response.data.did;
						},
						staleTime: Infinity,
						gcTime: 60 * 1_000,
					});
				}

				// 2. contact plc.directory to get their DID document
			}

			const uid = await multiagent.login({
				service: $service.url,
				identifier: $identifier,
				password: $password,
			});

			// Invalidate any queries involving this DID,
			// in the case that we're signing in to an already added account.
			queryClient.invalidateQueries({
				predicate: (query) => {
					const key = query.queryKey;
					return key.length >= 2 && key[1] === uid;
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
		<form onSubmit={handleSubmit} class={/* @once */ dialog.root()}>
			<div class={/* @once */ dialog.header()}>
				<h1 class={/* @once */ dialog.title()}>Add new account</h1>
			</div>

			<fieldset
				disabled={loginMutation.isPending}
				class={/* @once */ dialog.body({ class: 'flex flex-col gap-4' })}
			>
				<div class="flex flex-col gap-2">
					<label for="user" class="block text-sm font-medium leading-6 text-primary">
						Identifier
					</label>
					<input
						ref={model(identifier, setIdentifier)}
						type="text"
						id="user"
						required
						pattern=".*\S+.*"
						autocomplete="username"
						class={/* @once */ input()}
					/>
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
						class={/* @once */ input()}
					/>
				</div>

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

			<fieldset disabled={loginMutation.isPending} class={/* @once */ dialog.actions()}>
				<button type="button" onClick={closeModal} class={/* @once */ button({ variant: 'ghost' })}>
					Cancel
				</button>
				<button type="submit" class={/* @once */ button({ variant: 'primary' })}>
					Sign in
				</button>
			</fieldset>
		</form>
	);
};

export default AddAccountDialog;
