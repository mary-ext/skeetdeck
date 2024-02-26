import { createSignal } from 'solid-js';

import { Agent } from '@externdefs/bluesky-client/agent';
import { createMutation } from '@pkg/solid-query';

import { type DataServer, DEFAULT_DATA_SERVERS } from '~/api/globals/defaults';
import { formatQueryError } from '~/api/utils/misc';

import { createRadioModel, model, mutationAutofocus, refs } from '~/utils/input';
import { getUniqueId } from '~/utils/misc';

import { closeModal } from '~/com/globals/modals';

import DialogOverlay from '~/com/components/dialogs/DialogOverlay';
import Radio from '~/com/components/inputs/Radio';

import { Button } from '~/com/primitives/button';
import { DialogActions, DialogBody, DialogHeader, DialogRoot, DialogTitle } from '~/com/primitives/dialog';
import { Input } from '~/com/primitives/input';

import GlobeIcon from '~/com/icons/baseline-globe';

export interface ChooseServiceDialogProps {
	serviceUri?: string;
	onSubmit: (service: DataServer) => void;
}

const enum Chosen {
	BLUESKY_SOCIAL,
	CUSTOM,
}

const ChooseServiceDialog = (props: ChooseServiceDialogProps) => {
	const onSubmit = props.onSubmit;

	const initialUri = props.serviceUri;
	const initialIsDefault = isDefaultService(initialUri);

	const [chosen, setChosen] = createSignal(initialIsDefault ? Chosen.BLUESKY_SOCIAL : Chosen.CUSTOM);
	const [serviceUri, setServiceUri] = createSignal((!initialIsDefault && initialUri) || '');

	const formId = getUniqueId();
	const chosenModel = createRadioModel(chosen, setChosen);

	const pdsMutation = createMutation(() => {
		return {
			mutationFn: async ({ uri }: { uri: string }) => {
				const agent = new Agent({ serviceUri: uri });
				await agent.rpc.get('com.atproto.server.describeServer', {});
			},
			onSuccess(_data: void, { uri }) {
				const url = new URL(uri);
				const host = url.host;

				closeModal();
				onSubmit({ name: host, url: uri });
			},
		};
	});

	const handleSubmit = (ev: SubmitEvent) => {
		const $chosen = chosen();

		ev.preventDefault();

		if ($chosen === Chosen.BLUESKY_SOCIAL) {
			closeModal();

			// Mainly because we don't want to override the .host.bsky.network
			if (!initialIsDefault) {
				onSubmit(DEFAULT_DATA_SERVERS[0]);
			}
		} else if ($chosen === Chosen.CUSTOM) {
			const $serviceUri = serviceUri();
			pdsMutation.mutate({ uri: $serviceUri });
		}
	};

	return (
		<DialogOverlay>
			<form onSubmit={handleSubmit} class={/* @once */ DialogRoot({ size: 'sm' })}>
				<div class={/* @once */ DialogHeader()}>
					<h1 class={/* @once */ DialogTitle()}>Choose service</h1>
				</div>

				<fieldset disabled={pdsMutation.isPending} class="contents">
					<div class={/* @once */ DialogBody({ class: 'flex flex-col' })}>
						<div class="-mx-4">
							<label class="block px-4 py-3">
								<div class="flex min-w-0 justify-between gap-4">
									<span class="text-sm">Bluesky Social</span>
									<Radio ref={chosenModel(Chosen.BLUESKY_SOCIAL)} name={formId} />
								</div>
								<p class="mr-6 text-de text-muted-fg">Premier service hosted by Bluesky Social PBC.</p>
							</label>

							<label class="block px-4 py-3">
								<div class="flex min-w-0 justify-between gap-4">
									<span class="text-sm">Custom</span>
									<Radio ref={chosenModel(Chosen.CUSTOM)} name={formId} />
								</div>
								<p class="mr-6 text-de text-muted-fg">Connect to your own service</p>
							</label>
						</div>

						<fieldset hidden={chosen() !== Chosen.CUSTOM} class="contents">
							<hr class="mb-4 mt-1 border-divider" />

							<label class="block">
								<span class="mb-2 block text-sm font-medium leading-6">Service URL</span>

								<div class="relative">
									<fieldset class="pointer-events-none absolute left-0 top-0 grid h-9 w-9 place-items-center disabled:opacity-50">
										<GlobeIcon class="text-base text-muted-fg" />
									</fieldset>

									<input
										ref={refs(
											model(serviceUri, setServiceUri),
											mutationAutofocus(pdsMutation, !initialIsDefault),
										)}
										type="url"
										required={chosen() === Chosen.CUSTOM}
										class={/* @once */ Input({ class: 'pl-9' })}
									/>
								</div>
							</label>
						</fieldset>

						<p class="mt-4 text-de text-red-500 empty:hidden">
							{(() => {
								const error: unknown = pdsMutation.error;

								if (!error || chosen() !== Chosen.CUSTOM) {
									return null;
								}

								if (error instanceof TypeError) {
									return `Can't seem to contact the service, is it down?`;
								}

								return formatQueryError(error);
							})()}
						</p>
					</div>

					<div class={/* @once */ DialogActions()}>
						<button type="button" onClick={closeModal} class={/* @once */ Button({ variant: 'ghost' })}>
							Cancel
						</button>

						<button type="submit" class={/* @once */ Button({ variant: 'primary' })}>
							Done
						</button>
					</div>
				</fieldset>
			</form>
		</DialogOverlay>
	);
};

export default ChooseServiceDialog;

const isDefaultService = (serviceUri: string | undefined) => {
	if (serviceUri === undefined) {
		return true;
	}

	const url = new URL(serviceUri);
	const host = url.host;

	return host === 'bsky.social' || host.endsWith('.host.bsky.network');
};
