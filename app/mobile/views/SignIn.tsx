import { createSignal } from 'solid-js';

import { BskyXRPC } from '@externdefs/bluesky-client';
import { createQuery } from '@pkg/solid-query';

import { DEFAULT_DATA_SERVERS } from '~/api/globals/defaults';

import { model } from '~/utils/input';

import { Button } from '~/com/primitives/button';
import { IconButton } from '~/com/primitives/icon-button';
import { Input } from '~/com/primitives/input';

import ArrowLeftIcon from '~/com/icons/baseline-arrow-left';
import EditIcon from '~/com/icons/baseline-edit';

import ViewHeader from '../components/ViewHeader';

const APP_PASSWORD_LINK = 'https://atproto.com/community/projects#app-passwords';

const enum Steps {
	IDENTIFIER,
	PASSWORD,
}

const SignIn = () => {
	const [step, setStep] = createSignal(Steps.IDENTIFIER);

	const [service, setService] = createSignal(DEFAULT_DATA_SERVERS[0]);
	const [identifier, setIdentifier] = createSignal('');
	const [password, setPassword] = createSignal('');

	return (
		<fieldset class="contents">
			<div class="flex h-13 shrink-0 items-center border-b border-transparent px-4">
				<button
					title="Go back to previous page"
					onClick={() => {
						if (navigation.canGoBack) {
							navigation.back();
						} else {
							navigation.navigate('/', { history: 'replace' });
						}
					}}
					class={/* @once */ IconButton({ edge: 'left' })}
				>
					<ArrowLeftIcon />
				</button>
			</div>

			<div class="p-4">
				<h1 class="text-2xl font-semibold">Sign in</h1>
				<p class="mt-1 text-base text-muted-fg">To begin, enter your Bluesky handle, DID or email address.</p>
			</div>

			<form class="flex grow flex-col">
				<div class="flex grow flex-col gap-8 p-4">
					{(() => {
						const $step = step();

						if ($step === Steps.IDENTIFIER) {
							return (
								<fieldset class="contents">
									<label class="block">
										<span class="mb-2 block text-sm font-medium leading-6 text-primary">
											Bluesky handle, DID or email address
										</span>
										<input
											ref={model(identifier, setIdentifier)}
											type="text"
											required
											title="Bluesky handle, DID, or email address"
											pattern=".*\S+.*"
											placeholder="you.bsky.social"
											autocomplete="username"
											class={/* @once */ Input()}
										/>
									</label>
								</fieldset>
							);
						}
					})()}
				</div>

				<fieldset class="flex flex-col gap-3 border-t border-divider p-4">
					<button type="submit" class={/* @once */ Button({ variant: 'primary' })}>
						{step() === Steps.IDENTIFIER ? `Continue` : `Sign in`}
					</button>

					{(() => {
						const $step = step();

						if ($step === Steps.IDENTIFIER) {
							return (
								<button type="button" class="h-9 text-de text-accent hover:underline">
									Continue without automatic service resolution
								</button>
							);
						}
					})()}
				</fieldset>
			</form>
		</fieldset>
	);
};

export default SignIn;
